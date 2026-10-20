<?php

declare(strict_types=1);

namespace Primed\Off;

/**
 * Open Food Facts → Primed category (D-172). First matching stage wins:
 * 1. category overrides the food groups do not cover (supplements, nut butters, meat alternatives),
 * 2. the product's food group (the most specific one in GROUPS),
 * 3. rescue rules on categories for products without a food group,
 * 4. otherwise "other".
 * Afterwards protein powders with poor OFF data are caught: text in unnormalised tags, ≥ 60 g protein per 100 g,
 * or – only for products otherwise unknown – a powder word in the product name.
 * Ready-to-drink protein shakes are no supplement (D-175): → dairy (milk based), clear whey drinks → drinks.
 * GROUPS lists all 91 OFF food groups (taxonomies/food_groups.json) with their depth (1 = top group).
 */
final class OffCategoryMap
{
    public const FALLBACK = 'other';

    /** From this much protein per 100 g a drink, dairy product, snack or unknown product is a protein powder. */
    public const POWDER_PROTEIN_MIN = 60.0;

    /** Parts of unnormalised tags (e.g. "en:Nahrungsergänzungsmittel") that mark a supplement. */
    private const SUPPLEMENT_WORDS = ['nahrungserg', 'proteinpulver', 'eiweisspulver', 'eiweißpulver', 'whey-protein'];

    /** Name parts of protein powders; only used for otherwise unknown products (no OFF categories). */
    private const POWDER_NAME_WORDS = [
        'proteinpulver', 'protein pulver', 'protein powder', 'eiweißpulver', 'eiweisspulver', 'whey protein',
        'whey isolat', 'iso whey', 'casein',
    ];

    /** Up to this much protein per 100 g/ml a "protein shake" is ready to drink (usually 4–12 g), not a powder. */
    public const SHAKE_PROTEIN_MAX = 15.0;

    /** Categories a protein powder is often wrongly sorted into. */
    private const POWDER_SUSPECTS = ['drinks', 'dairy', 'snacks', 'other'];

    /** @var list<array{string, list<string>}> */
    private const OVERRIDES = [
        ['supplements', ['en:dietary-supplements', 'en:bodybuilding-supplements', 'en:protein-powders']],
        // Baby food often carries fruit or cereal categories.
        ['other', ['en:baby-foods', 'en:baby-milks', 'en:infant-formulas']],
        // Peanut butter sits under the food group "legumes"; nut butters have none.
        ['snacks', ['en:nut-butters', 'en:peanut-butters']],
        // Grilling cheese is listed under meat alternatives.
        ['dairy', ['en:grilling-cheeses']],
        // Seitan sits under "cereals", tempeh under "legumes", meat analogues have no group.
        ['meat', ['en:meat-alternatives', 'xx:tofu', 'en:tofu']],
    ];

    /** @var array<string, array{string, int}> food group => [category, depth] */
    public const GROUPS = [
        'en:alcoholic-beverages' => ['drinks', 1],
        'en:baby-foods-and-milks' => ['other', 1],
        'en:baby-foods' => ['other', 2],
        'en:baby-milks' => ['other', 2],
        'en:beverages' => ['drinks', 1],
        'en:artificially-sweetened-beverages' => ['drinks', 2],
        'en:fruit-juices' => ['drinks', 2],
        'en:fruit-nectars' => ['drinks', 2],
        'en:plant-based-milk-substitutes' => ['drinks', 2],
        'en:sweetened-beverages' => ['drinks', 2],
        'en:teas-and-herbal-teas-and-coffees' => ['drinks', 2],
        'en:unsweetened-beverages' => ['drinks', 2],
        'en:waters-and-flavored-waters' => ['drinks', 2],
        'en:cereals-and-potatoes' => ['grains', 1],
        'en:bread' => ['grains', 2],
        'en:breakfast-cereals' => ['grains', 2],
        'en:cereals' => ['grains', 2],
        'en:legumes' => ['meat', 2],
        'en:potatoes' => ['grains', 2],
        'en:other-refined-cereals' => ['grains', 3],
        'en:other-whole-grain-cereals' => ['grains', 3],
        'en:white-bread' => ['grains', 3],
        'en:white-pasta' => ['grains', 3],
        'en:white-rice' => ['grains', 3],
        'en:white-soft-bread' => ['grains', 3],
        'en:whole-grain-bread' => ['grains', 3],
        'en:whole-grain-pasta' => ['grains', 3],
        'en:whole-grain-rice' => ['grains', 3],
        'en:whole-grain-soft-bread' => ['grains', 3],
        'en:composite-foods' => ['meals', 1],
        'en:one-dish-meals' => ['meals', 2],
        'en:pizza-pies-and-quiches' => ['meals', 2],
        'en:sandwiches' => ['meals', 2],
        'en:fats-and-sauces' => ['sauces', 1],
        'en:dressings-and-sauces' => ['sauces', 2],
        'en:fats' => ['sauces', 2],
        'en:animal-fats' => ['sauces', 3],
        'en:dressings' => ['sauces', 3],
        'en:sauces' => ['sauces', 3],
        'en:vegetable-margarines' => ['sauces', 3],
        'en:vegetable-oils' => ['sauces', 3],
        'en:fish-meat-eggs' => ['meat', 1],
        'en:eggs' => ['meat', 2],
        'en:fish-and-seafood' => ['meat', 2],
        'en:meat' => ['meat', 2],
        'en:offals' => ['meat', 2],
        'en:processed-meat' => ['meat', 2],
        'en:fatty-fish' => ['meat', 3],
        'en:lean-fish' => ['meat', 3],
        'en:meat-other-than-poultry' => ['meat', 3],
        'en:poultry' => ['meat', 3],
        'en:seafood' => ['meat', 3],
        'en:smoked-fish' => ['meat', 3],
        'en:fresh-cheese' => ['dairy', 1],
        'en:fruits-and-vegetables' => ['produce', 1],
        'en:dehydrated-soups' => ['meals', 2],
        'en:dried-fruits' => ['snacks', 2],
        'en:fresh-soups' => ['meals', 2],
        'en:fruits' => ['produce', 2],
        'en:soups' => ['meals', 2],
        'en:vegetables' => ['produce', 2],
        'en:milk-and-dairy-products' => ['dairy', 1],
        'en:cheese' => ['dairy', 2],
        'en:dairy-desserts' => ['dairy', 2],
        'en:ice-cream' => ['snacks', 2],
        'en:milk-and-yogurt' => ['dairy', 2],
        'en:blue-cheese' => ['dairy', 3],
        'en:hard-cheese' => ['dairy', 3],
        'en:plain-milk-and-yogurt' => ['dairy', 3],
        'en:soft-cheese' => ['dairy', 3],
        'en:sweetened-milk-and-yogurt' => ['dairy', 3],
        'en:processed-cheese' => ['dairy', 1],
        'en:salty-snacks' => ['snacks', 1],
        'en:appetizers' => ['snacks', 2],
        'en:nuts' => ['snacks', 2],
        'en:salty-and-fatty-products' => ['snacks', 2],
        'en:nut-butter' => ['snacks', 3],
        'en:salted-nuts' => ['snacks', 3],
        'en:unsalted-nuts' => ['snacks', 3],
        'en:sugary-snacks' => ['snacks', 1],
        'en:biscuits-and-cakes' => ['snacks', 2],
        'en:chocolate-products' => ['snacks', 2],
        'en:pastries' => ['snacks', 2],
        'en:sweets' => ['snacks', 2],
        'en:dark-chocolate' => ['snacks', 3],
        'en:milk-chocolate' => ['snacks', 3],
        'en:other-chocolate-based-products' => ['snacks', 3],
        'en:white-chocolate' => ['snacks', 3],
        'en:unknown-food-group-1' => ['other', 1],
        'en:unknown-food-group-2' => ['other', 1],
        'en:unknown-food-group-3' => ['other', 1],
    ];

    /**
     * Used when the product has no food group (the OFF search returns none at all). Specific rules come before the
     * broad ones: butter before dairies, nuts and crisps before legumes and meals.
     *
     * @var list<array{string, list<string>}>
     */
    private const RESCUE = [
        ['sauces', ['en:butters', 'en:margarines', 'en:dairy-spreads', 'en:spreadable-fats']],
        [
            'snacks',
            [
                'en:nuts', 'en:peanuts', 'en:crisps', 'en:potato-crisps', 'en:ice-creams-and-sorbets',
                'en:frozen-desserts', 'en:sweeteners', 'en:honeys', 'en:sweet-spreads', 'en:jams',
            ],
        ],
        ['dairy', ['en:puddings', 'en:dairy-desserts']],
        [
            'meals',
            ['en:meals', 'en:prepared-meals', 'en:frozen-ready-meals', 'en:pizzas', 'en:soups', 'en:sandwiches'],
        ],
        [
            'meat',
            [
                'en:meats', 'en:meat-preparations', 'en:prepared-meats', 'en:poultries', 'en:fishes', 'en:seafood',
                'en:eggs', 'en:legumes',
            ],
        ],
        [
            'dairy',
            ['en:milks', 'en:dairies', 'en:cheeses', 'en:yogurts', 'en:quarks', 'en:fresh-cheeses', 'en:creams'],
        ],
        ['drinks', ['en:beverages', 'en:plant-based-beverages']],
        [
            'sauces',
            [
                'en:sauces', 'en:condiments', 'en:dressings', 'en:mayonnaises', 'en:ketchup', 'en:fats',
                'en:vegetable-oils', 'en:olive-oils',
            ],
        ],
        [
            'snacks',
            [
                'en:snacks', 'en:sweet-snacks', 'en:salty-snacks', 'en:pastries', 'en:biscuits', 'en:chocolates',
                'en:confectioneries', 'en:desserts',
            ],
        ],
        [
            'grains',
            [
                'en:breads', 'en:bakery-products', 'en:cereals-and-potatoes', 'en:cereals-and-their-products',
                'en:flours', 'en:pastas', 'en:rices', 'en:breakfast-cereals', 'en:potatoes',
            ],
        ],
        ['produce', ['en:fruits', 'en:vegetables', 'en:fruits-and-vegetables-based-foods']],
    ];

    /**
     * @param list<string> $categories OFF categories_tags
     * @param list<string> $groups OFF food_groups_tags
     * @param float|null $protein protein per 100 g or 100 ml
     */
    public static function category(
        array $categories,
        array $groups,
        ?float $protein = null,
        string $name = '',
    ): string {
        $category = self::powder(self::byTags($categories, $groups), $categories, $protein, $name);
        if (!in_array($category, ['supplements', self::FALLBACK], true) || $protein === null) {
            return $category;
        }
        $lower = mb_strtolower($name, 'UTF-8');
        $shake = in_array('en:protein-shakes', $categories, true)
            || str_contains($lower, 'shake') || str_contains($lower, 'drink');
        if (!$shake || $protein > self::SHAKE_PROTEIN_MAX) {
            return $category;
        }

        // Clear whey drinks are water based.
        return str_contains($lower, 'clear') ? 'drinks' : 'dairy';
    }

    /**
     * @param list<string> $categories
     */
    private static function powder(string $category, array $categories, ?float $protein, string $name): string
    {
        if ($category === 'supplements' || !in_array($category, self::POWDER_SUSPECTS, true)) {
            return $category;
        }
        foreach ($categories as $tag) {
            $lower = mb_strtolower($tag, 'UTF-8');
            foreach (self::SUPPLEMENT_WORDS as $word) {
                if (str_contains($lower, $word)) {
                    return 'supplements';
                }
            }
        }

        if ($protein !== null && $protein >= self::POWDER_PROTEIN_MIN) {
            return 'supplements';
        }
        if ($category === self::FALLBACK) {
            $lower = mb_strtolower($name, 'UTF-8');
            foreach (self::POWDER_NAME_WORDS as $word) {
                if (str_contains($lower, $word)) {
                    return 'supplements';
                }
            }
        }

        return $category;
    }

    /**
     * @param list<string> $categories
     * @param list<string> $groups
     */
    private static function byTags(array $categories, array $groups): string
    {
        foreach (self::OVERRIDES as [$category, $needles]) {
            if (array_intersect($needles, $categories) !== []) {
                return $category;
            }
        }

        $best = null;
        foreach ($groups as $group) {
            $entry = self::GROUPS[$group] ?? null;
            if ($entry !== null && ($best === null || $entry[1] > $best[1])) {
                $best = $entry;
            }
        }
        if ($best !== null) {
            return $best[0];
        }

        foreach (self::RESCUE as [$category, $needles]) {
            if (array_intersect($needles, $categories) !== []) {
                return $category;
            }
        }

        return self::FALLBACK;
    }
}
