<?php

declare(strict_types=1);

namespace Primed\Off;

use DateTimeImmutable;
use JsonException;
use PDO;
use Primed\Support\Clock;
use Primed\Support\Db;

/**
 * Open Food Facts lookups through the API only (D-035): only the barcode or the search term leaves the server.
 * Results are cached (barcodes 30 days, misses 1 day, searches 1 day).
 */
final class OffClient
{
    private const BASE = 'https://world.openfoodfacts.org';
    /** Search service (the legacy cgi/search.pl answers 503 since 2026). */
    private const SEARCH = 'https://search.openfoodfacts.org/search';
    private const FIELDS = 'code,product_name,product_name_de,brands,nutriments,product_quantity,'
        . 'product_quantity_unit,categories_tags';
    private const HIT_TTL_DAYS = 30;
    private const MISS_TTL_DAYS = 1;
    private const SEARCH_TTL_DAYS = 1;

    public function __construct(
        private readonly HttpFetcher $http,
        private readonly PDO $pdo,
        private readonly Clock $clock,
    ) {
    }

    public function byBarcode(string $barcode): ?OffProduct
    {
        $key = 'barcode:' . $barcode;
        $cached = $this->cached($key, self::HIT_TTL_DAYS);
        if ($cached !== false) {
            return $cached === null ? null : (self::productsFrom($cached)[0] ?? null);
        }

        $body = $this->http->get(self::BASE . '/api/v2/product/' . $barcode . '.json?fields=' . self::FIELDS);
        $product = null;
        if ($body !== null) {
            $data = self::decode($body);
            $raw = $data['product'] ?? null;
            $product = is_array($raw) && ($data['status'] ?? 0) === 1 ? OffProduct::fromOff($raw) : null;
        }
        $this->store($key, $product === null ? null : [$product]);

        return $product;
    }

    /**
     * @return list<OffProduct> at most 10, German market and language (D-053)
     */
    public function search(string $query): array
    {
        $normalized = mb_strtolower(trim((string) preg_replace('/\s+/u', ' ', $query)), 'UTF-8');
        $key = 'search:' . hash('sha256', $normalized);
        $cached = $this->cached($key, self::SEARCH_TTL_DAYS);
        if ($cached !== false) {
            return $cached === null ? [] : self::productsFrom($cached);
        }

        // Only letters, digits and spaces reach the Lucene query (no ':', quotes, '-', wildcards; the text is
        // lower-cased, so AND/OR/NOT are plain words). The country filter is appended by us.
        $lettersAndDigits = (string) preg_replace('/[^\p{L}\p{N}]+/u', ' ', $normalized);
        $phrase = trim((string) preg_replace('/\s+/u', ' ', $lettersAndDigits));
        if ($phrase === '') {
            return [];
        }
        $url = self::SEARCH . '?' . http_build_query([
            'q' => $phrase . ' countries_tags:"en:germany"',
            'page_size' => 10,
            'langs' => 'de',
            'fields' => self::FIELDS,
        ]);
        $body = $this->http->get($url);
        $products = [];
        if ($body !== null) {
            $list = self::decode($body)['hits'] ?? [];
            foreach (is_array($list) ? $list : [] as $raw) {
                $product = is_array($raw) ? OffProduct::fromOff($raw) : null;
                if ($product !== null) {
                    $products[] = $product;
                }
                if (count($products) === 10) {
                    break;
                }
            }
        }
        $this->store($key, $products);

        return $products;
    }

    /**
     * @return array<mixed>|null|false false = no fresh cache entry, null = cached miss
     */
    private function cached(string $key, int $ttlDays): array|null|false
    {
        $statement = $this->pdo->prepare('SELECT payload, fetched_at FROM off_cache WHERE cache_key = ?');
        $statement->execute([$key]);
        $row = $statement->fetch();
        if (!is_array($row) || !is_string($row['fetched_at'])) {
            return false;
        }
        $fetched = Db::parse($row['fetched_at']);
        $payload = $row['payload'];
        $ttl = $payload === null ? min($ttlDays, self::MISS_TTL_DAYS) : $ttlDays;
        if ($fetched < $this->clock->now()->modify('-' . $ttl . ' days')) {
            return false;
        }

        return is_string($payload) ? self::decode($payload) : null;
    }

    /**
     * @param list<OffProduct>|null $products
     */
    private function store(string $key, ?array $products): void
    {
        $payload = $products === null
            ? null
            : json_encode(array_map(static fn (OffProduct $p): array => $p->toArray(), $products), JSON_THROW_ON_ERROR);
        $this->pdo->prepare(
            'INSERT INTO off_cache (cache_key, payload, fetched_at) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE payload = VALUES(payload), fetched_at = VALUES(fetched_at)',
        )->execute([$key, $payload, Db::dateTime($this->clock->now())]);
    }

    /**
     * @param array<mixed> $cached normalized products
     * @return list<OffProduct>
     */
    private static function productsFrom(array $cached): array
    {
        $products = [];
        foreach ($cached as $item) {
            if (!is_array($item) || !is_array($item['nutrients'] ?? null)) {
                continue;
            }
            $raw = [
                'code' => $item['barcode'] ?? null,
                'product_name' => $item['name'] ?? null,
                'brands' => $item['brand'] ?? null,
                'nutriments' => [
                    'energy-kcal_100g' => $item['nutrients']['kcal'] ?? null,
                    'proteins_100g' => $item['nutrients']['protein'] ?? null,
                    'carbohydrates_100g' => $item['nutrients']['carbs'] ?? null,
                    'sugars_100g' => $item['nutrients']['sugar'] ?? null,
                    'fat_100g' => $item['nutrients']['fat'] ?? null,
                ],
                'product_quantity' => $item['packageAmount'] ?? null,
                'product_quantity_unit' => ($item['basis'] ?? '') === 'per_100ml' ? 'ml' : 'g',
                'categories_tags' => [],
            ];
            $product = OffProduct::fromOff($raw);
            if ($product !== null) {
                $products[] = new OffProduct(
                    $product->barcode,
                    $product->name,
                    $product->brand,
                    is_string($item['category'] ?? null) ? $item['category'] : $product->category,
                    $product->basis,
                    $product->kcal,
                    $product->protein,
                    $product->carbs,
                    $product->sugar,
                    $product->fat,
                    $product->packageAmount,
                );
            }
        }

        return $products;
    }

    /**
     * @return array<mixed>
     */
    private static function decode(string $json): array
    {
        try {
            $data = json_decode($json, true, 64, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw new OffUnavailable('invalid JSON');
        }

        return is_array($data) ? $data : [];
    }

    /** Removes stale cache rows (called opportunistically). */
    public function purge(DateTimeImmutable $before): void
    {
        $this->pdo->prepare('DELETE FROM off_cache WHERE fetched_at < ?')->execute([Db::dateTime($before)]);
    }
}
