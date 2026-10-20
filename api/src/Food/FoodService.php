<?php

declare(strict_types=1);

namespace Primed\Food;

use Primed\Day\LogicalCalendar;
use Primed\Day\SettingsRepository;
use Primed\Http\HttpException;
use Primed\Http\Input;
use Primed\Off\OffClient;
use Primed\Off\OffProduct;
use Primed\Off\OffUnavailable;
use Primed\Support\Clock;
use Primed\Support\UserRateLimit;

/**
 * Personal food library (BRIEFING §6) and Open Food Facts lookups (D-035, D-053).
 */
final class FoodService
{
    public const FREQUENT_WINDOW_MIN = 90;
    public const FREQUENT_LOOKBACK_DAYS = 60;

    public function __construct(
        private readonly FoodRepository $foods,
        private readonly SettingsRepository $settings,
        private readonly LogicalCalendar $calendar,
        private readonly Clock $clock,
        private readonly UserRateLimit $rateLimit,
        /** @var \Closure(): OffClient */
        private readonly \Closure $off,
    ) {
    }

    /**
     * @return list<Food>
     */
    public function search(int $userId, ?string $query, ?string $category, ?string $type, bool $mealPrep): array
    {
        if ($query !== null && (!mb_check_encoding($query, 'UTF-8') || mb_strlen($query, 'UTF-8') > 60)) {
            throw Input::invalid('Der Suchbegriff ist zu lang.');
        }

        return $this->foods->search($userId, $query, $category, $type, $mealPrep);
    }

    /**
     * "Häufig um diese Zeit": the 5 most logged foods within ±90 min of now over the last 60 days (D-083).
     *
     * @return list<Food>
     */
    public function frequent(int $userId): array
    {
        $boundary = $this->settings->get($userId)->dayBoundaryMin;
        $now = $this->clock->now();
        $wall = (int) $now->setTimezone(new \DateTimeZone(LogicalCalendar::TIMEZONE))->format('G') * 60
            + (int) $now->setTimezone(new \DateTimeZone(LogicalCalendar::TIMEZONE))->format('i');
        $logical = $wall < $boundary ? $wall + 1440 : $wall;
        $since = (new \DateTimeImmutable($this->calendar->today($boundary)))
            ->modify('-' . self::FREQUENT_LOOKBACK_DAYS . ' days')
            ->format('Y-m-d');

        return $this->foods->frequentAround($userId, $logical, self::FREQUENT_WINDOW_MIN, $boundary, $since);
    }

    public function get(int $userId, int $id): Food
    {
        return $this->foods->find($userId, $id) ?? throw HttpException::notFound();
    }

    public function create(int $userId, FoodInput $input, string $source): Food
    {
        $now = $this->clock->now();
        if ($input->barcode !== null) {
            if ($this->foods->findByBarcode($userId, $input->barcode) !== null) {
                throw self::duplicate();
            }
            $deleted = $this->foods->deletedIdByBarcode($userId, $input->barcode);
            if ($deleted !== null) {
                $this->foods->update($userId, $deleted, $input->toRow($source), $now);

                return $this->get($userId, $deleted);
            }
        }

        return $this->get($userId, $this->foods->create($userId, $input->toRow($source), $now));
    }

    public function update(int $userId, int $id, FoodInput $input): Food
    {
        $this->get($userId, $id);
        if ($input->barcode !== null) {
            $other = $this->foods->findByBarcode($userId, $input->barcode);
            if ($other !== null && $other->id !== $id) {
                throw self::duplicate();
            }
        }
        $this->foods->update($userId, $id, $input->toRow('manual'), $this->clock->now());

        return $this->get($userId, $id);
    }

    /**
     * Shared reference values for the search (D-170); same query rules as the library search.
     *
     * @return list<ReferenceFood>
     */
    public function references(int $userId, string $query): array
    {
        $query = trim($query);
        if (!mb_check_encoding($query, 'UTF-8') || mb_strlen($query, 'UTF-8') > 60) {
            throw Input::invalid('Der Suchbegriff ist zu lang.');
        }

        return $query === '' ? [] : $this->foods->searchReferences($userId, $query);
    }

    /**
     * The user's copy of a reference value, created on first use (or restored if deleted, D-170). Idempotent.
     */
    public function adoptReference(int $userId, int $referenceId): Food
    {
        $reference = $this->foods->findReference($referenceId) ?? throw HttpException::notFound();
        $now = $this->clock->now();
        $copy = $this->foods->copyOf($userId, $referenceId);
        if ($copy !== null) {
            [$id, $deleted] = $copy;
            if ($deleted) {
                $this->foods->restoreCopy($userId, $id, $reference, $now);
            }

            return $this->get($userId, $id);
        }

        return $this->get($userId, $this->foods->create($userId, [
            'type' => 'reference',
            'name' => $reference->name,
            'brand' => null,
            'barcode' => null,
            'category' => $reference->category,
            'basis' => $reference->basis,
            'kcal' => $reference->kcal,
            'protein' => $reference->protein,
            'carbs' => $reference->carbs,
            'sugar' => $reference->sugar,
            'fat' => $reference->fat,
            'packageAmount' => null,
            'pieceWeight' => $reference->pieceWeight,
            'source' => 'bls',
            'referenceFoodId' => $reference->id,
        ], $now));
    }

    public function delete(int $userId, int $id): void
    {
        $this->get($userId, $id);
        $this->foods->softDelete($userId, $id, $this->clock->now());
    }

    /**
     * Own library first, then Open Food Facts.
     *
     * @return array{source: 'library', food: Food}|array{source: 'off', product: OffProduct}
     */
    public function lookupBarcode(int $userId, string $barcode): array
    {
        if (!Barcode::isValid($barcode)) {
            throw Input::invalid('Der Barcode ist ungültig.');
        }
        $own = $this->foods->findByBarcode($userId, $barcode);
        if ($own !== null) {
            return ['source' => 'library', 'food' => $own];
        }

        $this->rateLimit->hit($userId, 'off_barcode', 30, 60);
        try {
            $product = ($this->off)()->byBarcode($barcode);
        } catch (OffUnavailable) {
            throw self::offUnavailable();
        }

        return $product === null
            ? throw new HttpException(404, 'not_found', 'Produkt nicht gefunden.')
            : ['source' => 'off', 'product' => $product];
    }

    /**
     * @return list<OffProduct>
     */
    public function searchOnline(int $userId, string $query): array
    {
        $query = trim($query);
        if (!mb_check_encoding($query, 'UTF-8')) {
            throw Input::invalid('Bitte gib 2 bis 60 Zeichen ein.');
        }
        $length = mb_strlen($query, 'UTF-8');
        if ($length < 2 || $length > 60 || preg_match('/\p{C}/u', $query) === 1) {
            throw Input::invalid('Bitte gib 2 bis 60 Zeichen ein.');
        }
        $this->rateLimit->hit($userId, 'off_search', 10, 60);
        try {
            return ($this->off)()->search($query);
        } catch (OffUnavailable) {
            throw self::offUnavailable();
        }
    }

    private static function duplicate(): HttpException
    {
        return new HttpException(
            409,
            'barcode_exists',
            'Ein Produkt mit diesem Barcode ist schon in deiner Bibliothek.',
        );
    }

    private static function offUnavailable(): HttpException
    {
        return new HttpException(503, 'off_unavailable', 'Open Food Facts ist gerade nicht erreichbar.');
    }
}
