<?php

declare(strict_types=1);

namespace Primed\Tests\Integration;

use Primed\Http\Request;
use Primed\Http\Response;
use Primed\Auth\SessionCookie;

/**
 * Day types, week template and days through the HTTP kernel (roadmap 2.1).
 */
final class DaysFlowTest extends ApiTestCase
{
    public function testTodayFollowsWeekTemplate(): void
    {
        $day = $this->day($this->call('GET', '/api/v1/days/today'));

        self::assertSame('2026-10-20', $day['date']);
        self::assertTrue($day['isToday']);
        self::assertSame('Normal · Basketball', $day['dayTypeName']);
        self::assertSame(1200, $day['trainingStart']);
        self::assertSame(90, $day['durationMin']);
        self::assertSame(['kcal' => 2600, 'protein' => 150, 'carbs' => 350, 'sugar' => 50], $day['targets']);
    }

    public function testDayEndsAtTwoInTheMorning(): void
    {
        $this->clock->advance('+12 hours +30 minutes'); // 2026-10-20 22:30 UTC = 00:30 Berlin on the 21st
        self::assertSame('2026-10-20', $this->day($this->call('GET', '/api/v1/days/today'))['date']);

        $this->clock->advance('+90 minutes'); // 02:00 Berlin
        self::assertSame('2026-10-21', $this->day($this->call('GET', '/api/v1/days/today'))['date']);
    }

    public function testFutureDaysAreRejected(): void
    {
        self::assertSame(422, $this->call('GET', '/api/v1/days/2026-10-21')->status);
        self::assertSame(422, $this->call('GET', '/api/v1/days/2026-02-30')->status);
        self::assertSame(404, $this->call('GET', '/api/v1/days/../etc')->status);
    }

    public function testManualDayTypeOverridesTemplateForThatDayOnly(): void
    {
        $restId = $this->dayTypeId('Ruhetag');
        $response = $this->call('PUT', '/api/v1/days/2026-10-20', ['dayTypeId' => $restId]);
        self::assertSame(200, $response->status);

        $today = $this->day($this->call('GET', '/api/v1/days/today'));
        self::assertSame('Ruhetag', $today['dayTypeName']);
        self::assertSame('manual', $today['source']);
        self::assertNull($today['trainingStart']);
        self::assertSame(2000, $today['targets']['kcal']);

        // Next Tuesday still comes from the template.
        $this->clock->advance('+7 days');
        self::assertSame('Normal · Basketball', $this->day($this->call('GET', '/api/v1/days/today'))['dayTypeName']);
    }

    public function testTrainingTimeValidation(): void
    {
        $basketball = $this->dayTypeId('Normal · Basketball');

        $invalid = [
            ['trainingStart' => 480],
            ['trainingStart' => 1210],
            ['trainingStart' => null],
            ['trainingStart' => 1200, 'durationMin' => 75],
        ];
        foreach ($invalid as $extra) {
            $response = $this->call('PUT', '/api/v1/days/2026-10-20', ['dayTypeId' => $basketball] + $extra);
            self::assertSame(422, $response->status, (string) json_encode($extra));
        }

        $ok = $this->call('PUT', '/api/v1/days/2026-10-20', ['dayTypeId' => $basketball, 'trainingStart' => 540]);
        self::assertSame(540, $this->day($ok)['trainingStart']);
        self::assertSame(90, $this->day($ok)['durationMin']);
    }

    public function testSettingsChangesApplyFromTodayAndPastDaysStayFixed(): void
    {
        $restId = $this->dayTypeId('Ruhetag');
        // Saturday 2026-10-17 was a rest day with 2.000 kcal and nobody looked at it yet.
        $this->call('PATCH', '/api/v1/day-types/' . $restId, [
            'name' => 'Ruhetag',
            'kcal' => 2100,
            'protein' => null,
            'carbs' => 200,
            'sugarRef' => 50,
            'isTraining' => false,
        ]);
        $this->call('PATCH', '/api/v1/settings', ['proteinDefault' => 160]);

        $saturday = $this->day($this->call('GET', '/api/v1/days/2026-10-17'));
        self::assertSame(2000, $saturday['targets']['kcal']);
        self::assertSame(150, $saturday['targets']['protein']);

        $today = $this->day($this->call('GET', '/api/v1/days/today'));
        self::assertSame(160, $today['targets']['protein']);

        $this->call('PUT', '/api/v1/days/2026-10-20', ['dayTypeId' => $restId]);
        self::assertSame(2100, $this->day($this->call('GET', '/api/v1/days/today'))['targets']['kcal']);
    }

    public function testWeekTemplateChangeKeepsPastDays(): void
    {
        $restId = $this->dayTypeId('Ruhetag');
        $days = [];
        for ($weekday = 1; $weekday <= 7; $weekday++) {
            $days[] = ['weekday' => $weekday, 'dayTypeId' => $restId, 'trainingStart' => null, 'durationMin' => null];
        }
        self::assertSame(200, $this->call('PUT', '/api/v1/week-template', ['days' => $days])->status);

        // Thursday 2026-10-15 was basketball according to the old template.
        $thursday = $this->day($this->call('GET', '/api/v1/days/2026-10-15'));
        self::assertSame('Normal · Basketball', $thursday['dayTypeName']);
        self::assertSame('Ruhetag', $this->day($this->call('GET', '/api/v1/days/today'))['dayTypeName']);
    }

    public function testWeekTemplateValidation(): void
    {
        $restId = $this->dayTypeId('Ruhetag');
        $basketball = $this->dayTypeId('Normal · Basketball');
        $base = [];
        for ($weekday = 1; $weekday <= 7; $weekday++) {
            $base[] = ['weekday' => $weekday, 'dayTypeId' => $restId, 'trainingStart' => null, 'durationMin' => null];
        }

        $missing = array_slice($base, 0, 6);
        $duplicate = $base;
        $duplicate[6]['weekday'] = 1;
        $noTime = $base;
        $noTime[1] = ['weekday' => 2, 'dayTypeId' => $basketball, 'trainingStart' => null, 'durationMin' => 90];

        foreach ([$missing, $duplicate, $noTime] as $days) {
            self::assertSame(422, $this->call('PUT', '/api/v1/week-template', ['days' => $days])->status);
        }
    }

    public function testDayTypeCrudAndDeletionRules(): void
    {
        $created = $this->call('POST', '/api/v1/day-types', [
            'name' => 'Krafttraining',
            'kcal' => 2500,
            'protein' => 170,
            'carbs' => 280,
            'sugarRef' => 50,
            'isTraining' => true,
        ]);
        self::assertSame(201, $created->status);
        $body = self::json($created);
        self::assertIsArray($body['dayType']);
        self::assertSame(170, $body['dayType']['effectiveProtein']);

        // Used in the template → cannot be deleted.
        $basketball = $this->dayTypeId('Normal · Basketball');
        self::assertSame(422, $this->call('DELETE', '/api/v1/day-types/' . $basketball)->status);

        // Unused but used by a past day → deleted; the past day keeps its name.
        $light = $this->dayTypeId('Leichtes Training');
        $this->call('PUT', '/api/v1/days/2026-10-19', ['dayTypeId' => $light, 'trainingStart' => 1080]);
        self::assertSame(204, $this->call('DELETE', '/api/v1/day-types/' . $light)->status);
        self::assertSame('Leichtes Training', $this->day($this->call('GET', '/api/v1/days/2026-10-19'))['dayTypeName']);
        self::assertSame(404, $this->call('PATCH', '/api/v1/day-types/' . $light, ['name' => 'x'])->status);
    }

    public function testRestDayIsFixed(): void
    {
        $rest = $this->dayTypeId('Ruhetag');
        $types = self::json($this->call('GET', '/api/v1/day-types'))['dayTypes'];
        self::assertIsArray($types);
        self::assertTrue(is_array($types[0]) && $types[0]['isRest'] === true);

        self::assertSame(422, $this->call('DELETE', '/api/v1/day-types/' . $rest)->status);
        $payload = ['kcal' => 2100, 'protein' => null, 'carbs' => 200, 'sugarRef' => 50];
        $path = '/api/v1/day-types/' . $rest;
        $cases = [['Pause', false, 422], ['Ruhetag', true, 422], ['Ruhetag', false, 200]];
        foreach ($cases as [$name, $training, $status]) {
            $response = $this->call('PATCH', $path, $payload + ['name' => $name, 'isTraining' => $training]);
            self::assertSame($status, $response->status);
        }
    }

    public function testThirtyMinuteTrainingIsAllowed(): void
    {
        $basketball = $this->dayTypeId('Normal · Basketball');
        $day = $this->call('PUT', '/api/v1/days/2026-10-20', [
            'dayTypeId' => $basketball,
            'trainingStart' => 1200,
            'durationMin' => 30,
        ]);
        self::assertSame(30, $this->day($day)['durationMin']);
    }

    public function testDayTypeValidation(): void
    {
        $base = [
            'name' => 'X',
            'kcal' => 2000,
            'protein' => null,
            'carbs' => 200,
            'sugarRef' => 50,
            'isTraining' => false,
        ];
        $invalid = [
            ['name' => ''],
            ['name' => "Ru\u{0000}he"],
            ['kcal' => '2000'],
            ['kcal' => 99999],
            ['kcal' => 1000, 'protein' => 200],
        ];
        foreach ($invalid as $override) {
            $payload = $override + $base;
            $status = $this->call('POST', '/api/v1/day-types', $payload)->status;
            self::assertSame(422, $status, (string) json_encode($payload));
        }
    }

    public function testUsersCannotTouchEachOthersData(): void
    {
        $foreign = $this->dayTypeId('Ruhetag', 'freund');

        self::assertSame(404, $this->call('PUT', '/api/v1/days/2026-10-20', ['dayTypeId' => $foreign])->status);
        self::assertSame(404, $this->call('DELETE', '/api/v1/day-types/' . $foreign)->status);
        self::assertSame(404, $this->call('PATCH', '/api/v1/day-types/' . $foreign, [
            'name' => 'gehackt',
            'kcal' => 2000,
            'protein' => null,
            'carbs' => 200,
            'sugarRef' => 50,
            'isTraining' => false,
        ])->status);

        // The friend's template is untouched and neutral.
        $friendToday = $this->day($this->call('GET', '/api/v1/days/today', null, 'freund'));
        self::assertSame('Ruhetag', $friendToday['dayTypeName']);
    }

    public function testWritesNeedCsrfAndReadsNeedSession(): void
    {
        $response = $this->app->handle(new Request(
            'PATCH',
            '/api/v1/settings',
            ['Origin' => self::ORIGIN, 'Content-Type' => 'application/json'],
            '{"theme":"dark"}',
            '203.0.113.7',
            [],
            [SessionCookie::NAME => $this->tokens['marcch'] ?? ''],
        ));
        self::assertSame(403, $response->status);

        $anonymous = $this->app->handle(new Request('GET', '/api/v1/days/today'));
        self::assertSame(401, $anonymous->status);
    }

    public function testSettingsThemeValidation(): void
    {
        self::assertSame(422, $this->call('PATCH', '/api/v1/settings', ['theme' => 'pink'])->status);
        $ok = self::json($this->call('PATCH', '/api/v1/settings', ['theme' => 'dark']));
        self::assertIsArray($ok['settings']);
        self::assertSame('dark', $ok['settings']['theme']);
    }

    private function dayTypeId(string $name, string $as = 'marcch'): int
    {
        $types = self::json($this->call('GET', '/api/v1/day-types', null, $as))['dayTypes'] ?? null;
        self::assertIsArray($types);
        foreach ($types as $type) {
            if (is_array($type) && $type['name'] === $name && is_int($type['id'])) {
                return $type['id'];
            }
        }
        self::fail('Day type not found: ' . $name);
    }

    /**
     * @return array{date: string, isToday: bool, dayTypeName: string, trainingStart: int|null,
     *     durationMin: int|null, source: string, targets: array{kcal: int, protein: int, carbs: int, sugar: int}}
     */
    private function day(Response $response): array
    {
        self::assertSame(200, $response->status, $response->body);
        $day = self::json($response)['day'] ?? null;
        self::assertIsArray($day);

        /** @var array{date: string, isToday: bool, dayTypeName: string, trainingStart: int|null,
         *     durationMin: int|null, source: string, targets: array{kcal: int, protein: int, carbs: int, sugar: int}} $day */
        return $day;
    }
}
