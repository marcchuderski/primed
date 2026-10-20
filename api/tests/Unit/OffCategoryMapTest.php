<?php

declare(strict_types=1);

namespace Primed\Tests\Unit;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Primed\Food\FoodInput;
use Primed\Off\OffCategoryMap;
use Primed\Off\OffProduct;

/**
 * OFF → Primed category (D-172): overrides, food groups (most specific wins), rescue rules, fallback.
 */
final class OffCategoryMapTest extends TestCase
{
    /**
     * @return iterable<string, array{list<string>, list<string>, string}>
     */
    public static function cases(): iterable
    {
        // Stage 1: overrides beat the food group.
        yield 'protein powder' => [
            ['en:dietary-supplements', 'en:bodybuilding-supplements', 'en:protein-powders'],
            [],
            'supplements',
        ];
        yield 'peanut butter (group legumes)' => [
            ['en:plant-based-foods', 'en:legumes-and-their-products', 'en:peanut-butters'],
            ['en:cereals-and-potatoes', 'en:legumes'],
            'snacks',
        ];
        yield 'almond butter (no group)' => [['en:nuts-and-their-products', 'en:nut-butters'], [], 'snacks'];
        yield 'seitan (group cereals)' => [
            ['en:meat-alternatives', 'en:seitan'],
            ['en:cereals-and-potatoes', 'en:cereals'],
            'meat',
        ];
        yield 'tofu' => [['en:plant-based-foods', 'xx:tofu'], [], 'meat'];
        yield 'vegan sausage' => [['en:meat-alternatives', 'en:meat-analogues', 'en:vegetarian-sausages'], [], 'meat'];
        yield 'grilling cheese (under meat alternatives)' => [
            ['en:meat-alternatives', 'en:grilling-cheeses'],
            [],
            'dairy',
        ];

        // Stage 2: food groups, the most specific one wins.
        yield 'milk' => [
            ['en:milks'],
            ['en:milk-and-dairy-products', 'en:milk-and-yogurt', 'en:plain-milk-and-yogurt'],
            'dairy',
        ];
        yield 'oat drink' => [
            ['en:plant-based-beverages'],
            ['en:beverages', 'en:plant-based-milk-substitutes'],
            'drinks',
        ];
        yield 'butter' => [['en:dairies', 'en:butters'], ['en:fats-and-sauces', 'en:fats', 'en:animal-fats'], 'sauces'];
        yield 'margarine' => [
            ['en:margarines'],
            ['en:fats-and-sauces', 'en:fats', 'en:vegetable-margarines'],
            'sauces',
        ];
        yield 'lentils' => [['en:lentils'], ['en:cereals-and-potatoes', 'en:legumes'], 'meat'];
        yield 'pasta' => [['en:pastas'], ['en:cereals-and-potatoes', 'en:cereals', 'en:white-pasta'], 'grains'];
        yield 'bread' => [['en:breads'], ['en:cereals-and-potatoes', 'en:bread', 'en:whole-grain-bread'], 'grains'];
        yield 'potatoes' => [['en:potatoes'], ['en:cereals-and-potatoes', 'en:potatoes'], 'grains'];
        yield 'nuts' => [['en:nuts'], ['en:salty-snacks', 'en:nuts', 'en:unsalted-nuts'], 'snacks'];
        yield 'dried fruit' => [['en:dried-fruits'], ['en:fruits-and-vegetables', 'en:dried-fruits'], 'snacks'];
        yield 'ice cream (group under dairy)' => [
            ['en:ice-creams'],
            ['en:milk-and-dairy-products', 'en:ice-cream'],
            'snacks',
        ];
        yield 'pudding' => [['en:puddings'], ['en:milk-and-dairy-products', 'en:dairy-desserts'], 'dairy'];
        yield 'skyr' => [['en:skyrs'], ['en:milk-and-dairy-products', 'en:dairy-desserts'], 'dairy'];
        yield 'soup' => [['en:soups'], ['en:fruits-and-vegetables', 'en:soups'], 'meals'];
        yield 'pizza' => [['en:pizzas'], ['en:composite-foods', 'en:pizza-pies-and-quiches'], 'meals'];
        yield 'chocolate' => [
            ['en:chocolates'],
            ['en:sugary-snacks', 'en:chocolate-products', 'en:dark-chocolate'],
            'snacks',
        ];
        yield 'honey' => [['en:honeys'], ['en:sugary-snacks', 'en:sweets'], 'snacks'];
        yield 'chicken' => [['en:poultries'], ['en:fish-meat-eggs', 'en:meat', 'en:poultry'], 'meat'];
        yield 'beer' => [['en:beers'], ['en:alcoholic-beverages'], 'drinks'];
        yield 'baby food' => [['en:baby-foods'], ['en:baby-foods-and-milks', 'en:baby-foods'], 'other'];
        yield 'unknown group' => [['en:spices'], ['en:unknown-food-group-1'], 'other'];
        yield 'group order does not matter' => [[], ['en:dairy-desserts', 'en:milk-and-dairy-products'], 'dairy'];

        // Stage 3: rescue for products with categories but no food group.
        yield 'rescue: milk' => [['en:dairies', 'en:milks'], [], 'dairy'];
        yield 'rescue: plant drink' => [['en:beverages', 'en:plant-based-beverages'], [], 'drinks'];
        yield 'rescue: oil' => [['en:fats', 'en:vegetable-oils'], [], 'sauces'];
        yield 'rescue: flour' => [['en:flours'], [], 'grains'];
        yield 'rescue: ready meal' => [['en:meals', 'en:pizzas', 'en:cheeses'], [], 'meals'];

        yield 'rescue: butter before dairies' => [
            ['en:dairies', 'en:dairy-spreads', 'en:milkfat', 'en:butters'],
            [],
            'sauces',
        ];
        yield 'rescue: peanuts before legumes' => [
            ['en:legumes', 'en:nuts', 'en:peanuts', 'en:roasted-peanuts'],
            [],
            'snacks',
        ];
        yield 'rescue: crisps despite a meals tag' => [['en:meals', 'en:crisps', 'en:potato-crisps'], [], 'snacks'];
        yield 'rescue: ice cream' => [
            ['en:frozen-desserts', 'en:ice-creams-and-sorbets', 'en:ice-creams'],
            [],
            'snacks',
        ];
        yield 'rescue: pudding' => [['en:desserts', 'en:puddings'], [], 'dairy'];
        yield 'rescue: honey' => [['en:farming-products', 'en:sweeteners', 'en:honeys'], [], 'snacks'];
        yield 'rescue: gnocchi' => [['en:cereals-and-potatoes', 'en:gnocchi'], [], 'grains'];
        yield 'rescue: chicken slices' => [['en:meats', 'en:prepared-meats', 'en:poultry-hams'], [], 'meat'];
        yield 'baby food with fruit categories' => [
            ['en:baby-foods', 'en:fruits-based-foods', 'en:compotes'],
            [],
            'other',
        ];

        // Stage 4: fallback.
        yield 'nothing known' => [['en:spices'], [], 'other'];
        yield 'no tags at all' => [[], [], 'other'];
    }

    /**
     * @param list<string> $categories
     * @param list<string> $groups
     */
    #[DataProvider('cases')]
    public function testMapsToTheExpectedCategory(array $categories, array $groups, string $expected): void
    {
        self::assertSame($expected, OffCategoryMap::category($categories, $groups));
    }

    public function testCatchesProteinPowdersWithPoorOffData(): void
    {
        // ESN Designer Whey as listed by OFF (10/2026): an artificially sweetened beverage.
        $whey = [['en:beverages-and-beverages-preparations', 'en:beverages', 'en:Nahrungsergänzungsmittel'],
            ['en:beverages', 'en:artificially-sweetened-beverages']];
        self::assertSame('supplements', OffCategoryMap::category(...$whey));
        self::assertSame('supplements', OffCategoryMap::category(['de:proteinpulver'], []));
        self::assertSame('supplements', OffCategoryMap::category(['en:beverages'], [], 72.0));
        self::assertSame('supplements', OffCategoryMap::category([], [], 80.0), 'unknown, but 80 g protein');
        self::assertSame('drinks', OffCategoryMap::category(['en:beverages'], [], 59.9));
        self::assertSame('drinks', OffCategoryMap::category(['en:beverages'], [], null));
        self::assertSame('supplements', OffCategoryMap::category([], [], 22.5, 'Strawberry Protein Powder'));
        self::assertSame('supplements', OffCategoryMap::category([], [], null, 'Proteinpulver'));
        $spread = [['en:chocolate-spreads'], ['en:sugary-snacks', 'en:sweets'], 21.0, 'Whey Protein Creme'];
        self::assertSame('snacks', OffCategoryMap::category(...$spread), 'name rule only for unknown products');
        self::assertSame('other', OffCategoryMap::category([], [], 23.0, 'No whey bar'));
        $driedFish = [['en:fishes', 'en:dried-fishes'], ['en:fish-meat-eggs', 'en:fish-and-seafood'], 79.0];
        self::assertSame('meat', OffCategoryMap::category(...$driedFish), 'dried fish stays meat');
        $proteinPasta = [['en:pastas'], ['en:cereals-and-potatoes', 'en:cereals'], 65.0];
        self::assertSame('grains', OffCategoryMap::category(...$proteinPasta));
    }

    public function testReadyToDrinkShakesAreNoSupplements(): void
    {
        $shake = ['en:dietary-supplements', 'en:bodybuilding-supplements', 'en:protein-shakes'];
        self::assertSame('dairy', OffCategoryMap::category($shake, [], 8.0, 'High Protein Drink Typ Pistazie'));
        self::assertSame('dairy', OffCategoryMap::category($shake, [], 5.1, 'Stay Strong Kakao Milch'));
        self::assertSame('drinks', OffCategoryMap::category($shake, [], 4.0, 'Isoclear Protein Drink'));
        self::assertSame('dairy', OffCategoryMap::category([], [], 10.0, 'High Protein Shake Banane'));
        self::assertSame('supplements', OffCategoryMap::category($shake, [], 81.0, 'Gourmet Premium Pro Protein'));
        self::assertSame('other', OffCategoryMap::category([], [], 23.0, 'Vegan Shape Shake'), 'powder, not a drink');
        $creatine = ['en:dietary-supplements', 'en:bodybuilding-supplements'];
        self::assertSame('supplements', OffCategoryMap::category($creatine, [], 0.0, 'Creatine Monohydrate Powder'));
        $bar = [['en:snacks'], [], 10.0, 'Protein Drink Bar'];
        self::assertSame('snacks', OffCategoryMap::category(...$bar), 'only supplements or unknown products');
    }

    public function testCoversAll91FoodGroupsWithValidCategories(): void
    {
        self::assertCount(91, OffCategoryMap::GROUPS);
        foreach (OffCategoryMap::GROUPS as $group => [$category, $depth]) {
            self::assertContains($category, FoodInput::CATEGORIES, $group);
            self::assertGreaterThanOrEqual(1, $depth);
            self::assertLessThanOrEqual(3, $depth);
        }
        self::assertContains(OffCategoryMap::FALLBACK, FoodInput::CATEGORIES);
    }

    public function testProductUsesFoodGroups(): void
    {
        $product = OffProduct::fromOff([
            'code' => '4006381333931',
            'product_name' => 'Rote Linsen',
            'categories_tags' => ['en:legumes'],
            'food_groups_tags' => ['en:cereals-and-potatoes', 'en:legumes'],
            'nutriments' => ['energy-kcal_100g' => 340, 'proteins_100g' => 24, 'carbohydrates_100g' => 50,
                'sugars_100g' => 2, 'fat_100g' => 1.5],
        ]);
        self::assertNotNull($product);
        self::assertSame('meat', $product->category);
    }
}
