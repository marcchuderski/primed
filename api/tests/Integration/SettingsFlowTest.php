<?php

declare(strict_types=1);

namespace Primed\Tests\Integration;

use Primed\Auth\SessionCookie;
use Primed\Http\Request;

/**
 * Menu and settings (roadmap 7.1): settings groups, profile, account deletion.
 */
final class SettingsFlowTest extends ApiTestCase
{
    public function testSettingsGroupsAreValidatedAndStored(): void
    {
        $response = $this->call('PATCH', '/api/v1/settings', [
            'checkpoint' => ['offsetMin' => 165, 'pct' => 75, 'earliestMin' => 390],
            'earliestTrainingMin' => 570,
            'tolerancePct' => 7,
            'thresholds' => ['minProteinGap' => 30, 'restShakeFrom' => 1200],
        ]);
        self::assertSame(200, $response->status, $response->body);
        $settings = self::json($response)['settings'];
        self::assertIsArray($settings);
        self::assertSame(['offsetMin' => 165, 'pct' => 75, 'earliestMin' => 390], $settings['checkpoint']);
        self::assertSame(570, $settings['earliestTrainingMin']);
        self::assertSame(7, $settings['tolerancePct']);
        self::assertIsArray($settings['thresholds']);
        self::assertSame(30, $settings['thresholds']['minProteinGap']);
        self::assertSame(1200, $settings['thresholds']['restShakeFrom']);
        self::assertSame(35, $settings['thresholds']['bigShakeProtein']);

        // Partial updates keep everything else.
        $after = self::json($this->call('PATCH', '/api/v1/settings', ['tolerancePct' => 5]))['settings'];
        self::assertIsArray($after);
        self::assertSame(570, $after['earliestTrainingMin']);
    }

    public function testSettingsRejectOutOfRangeAndOffStepValues(): void
    {
        foreach (
            [
                ['checkpoint' => ['offsetMin' => 170, 'pct' => 70, 'earliestMin' => 360]],
                ['checkpoint' => ['offsetMin' => 180, 'pct' => 99, 'earliestMin' => 360]],
                ['checkpoint' => ['offsetMin' => 180, 'pct' => 70, 'earliestMin' => 200]],
                ['earliestTrainingMin' => 240],
                ['tolerancePct' => 0],
                ['tolerancePct' => 16],
                ['thresholds' => ['minProteinGap' => -1]],
                ['thresholds' => ['unknown' => 5]],
                ['shake' => ['bigMl' => 400]],
                ['shake' => ['powderG' => 5]],
                ['checkpoint' => 'x'],
            ] as $body
        ) {
            self::assertSame(422, $this->call('PATCH', '/api/v1/settings', $body)->status, (string) json_encode($body));
        }
    }

    public function testShakePowderMustBeOwnProductWithPer100Basis(): void
    {
        $foods = self::json($this->call('GET', '/api/v1/foods?q=Milch'))['foods'];
        self::assertIsArray($foods);
        $milk = $foods[0] ?? null;
        self::assertIsArray($milk);
        $milkId = $milk['id'];
        self::assertIsInt($milkId);

        $ok = self::json($this->call('PATCH', '/api/v1/settings', [
            'shake' => ['proteinPowderFoodId' => $milkId, 'powderG' => 35],
        ]))['settings'];
        self::assertIsArray($ok);
        self::assertSame(['proteinPowder' => $milkId], $ok['shakeFoods']);
        self::assertSame(35, $ok['shakePowderG']);

        // Another user's food is invisible.
        self::assertSame(404, $this->call('PATCH', '/api/v1/settings', [
            'shake' => ['proteinPowderFoodId' => $milkId],
        ], 'freund')->status);

        // Clearing is allowed.
        $cleared = self::json($this->call('PATCH', '/api/v1/settings', [
            'shake' => ['proteinPowderFoodId' => null],
        ]))['settings'];
        self::assertIsArray($cleared);
        self::assertSame(['proteinPowder' => null], $cleared['shakeFoods']);
    }

    public function testProfileChangesOnlyTheDisplayNameUsernameIsFixed(): void
    {
        // D-152: the username cannot be changed, not even to a free or the own value.
        foreach (['marc.c', 'marcch'] as $username) {
            $response = $this->call('PATCH', '/api/v1/profile', ['displayName' => 'Marc', 'username' => $username]);
            self::assertSame(422, $response->status, $username);
        }
        self::assertSame(422, $this->call('PATCH', '/api/v1/profile', ['displayName' => ''])->status);

        $response = $this->call('PATCH', '/api/v1/profile', ['displayName' => 'Marc C.']);
        self::assertSame(200, $response->status, $response->body);
        $user = self::json($response)['user'];
        self::assertIsArray($user);
        self::assertSame('Marc C.', $user['displayName']);
        self::assertSame('marcch', $user['username']);
    }

    public function testAccountDeletionNeedsPasswordAndRemovesAllData(): void
    {
        $stmt = $this->pdo->prepare('SELECT id FROM users WHERE username = ?');
        $stmt->execute(['freund']);
        $freundId = (int) $stmt->fetchColumn();
        self::assertGreaterThan(0, $freundId);
        $this->call('POST', '/api/v1/entries/shake', [
            'date' => '2026-10-20',
            'timeMin' => 600,
            'shake' => 'big_milk_low',
        ], 'freund');

        $wrong = $this->call('POST', '/api/v1/account/delete', ['password' => 'falsch'], 'freund');
        self::assertSame(422, $wrong->status);
        self::assertSame(200, $this->call('GET', '/api/v1/auth/me', null, 'freund')->status);

        $response = $this->call('POST', '/api/v1/account/delete', ['password' => self::PASSWORD], 'freund');
        self::assertSame(204, $response->status, $response->body);
        self::assertStringContainsString('Max-Age=0', (string) $response->header('Set-Cookie'));
        self::assertSame(401, $this->call('GET', '/api/v1/auth/me', null, 'freund')->status);

        foreach (['users', 'foods', 'entries', 'day_types', 'week_template', 'user_settings', 'sessions'] as $table) {
            $column = $table === 'users' ? 'username' : 'user_id';
            $value = $table === 'users' ? 'freund' : $freundId;
            $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM {$table} WHERE {$column} = ?");
            $stmt->execute([$value]);
            self::assertSame(0, (int) $stmt->fetchColumn(), $table);
        }

        // The other account is untouched.
        self::assertSame(200, $this->call('GET', '/api/v1/days/today')->status);
    }

    public function testProfileAndDeletionNeedCsrf(): void
    {
        $cases = [
            ['PATCH', '/api/v1/profile', '{"displayName":"X"}'],
            ['POST', '/api/v1/account/delete', '{"password":"x"}'],
        ];
        foreach ($cases as [$method, $path, $body]) {
            $response = $this->app->handle(new Request(
                $method,
                $path,
                ['Origin' => self::ORIGIN, 'Content-Type' => 'application/json'],
                $body,
                '203.0.113.7',
                [],
                [SessionCookie::NAME => $this->tokens['freund'] ?? ''],
            ));
            self::assertSame(403, $response->status, $path);
        }
        self::assertSame(200, $this->call('GET', '/api/v1/auth/me', null, 'freund')->status);
    }

    public function testAccountDeletionIsRateLimited(): void
    {
        for ($i = 0; $i < 10; $i++) {
            $this->call('POST', '/api/v1/account/delete', ['password' => 'falsch'], 'freund');
        }
        self::assertSame(
            429,
            $this->call('POST', '/api/v1/account/delete', ['password' => self::PASSWORD], 'freund')->status,
        );
    }
}
