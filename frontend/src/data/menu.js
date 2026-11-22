/**
 * The menu. Prices are in dirhams (MAD). `veg: true` marks vegetarian dishes.
 * `image` is the name of a photo in frontend/static/img (see images.json).
 * Each category may have a photo; each dish needs its name and description in the three languages.
 */
export const menu = [
  {
    id: 'starters',
    image: 'salads',
    title: { fr: 'Entrées', ar: 'المقبلات', en: 'Starters' },
    imageAlt: {
      fr: 'Salades marocaines de carottes et de tomates servies dans des plats en terre cuite',
      ar: 'سلطات مغربية من الجزر والطماطم في أطباق فخارية',
      en: 'Moroccan carrot and tomato salads served in clay dishes',
    },
    items: [
      {
        id: 'moroccan-salad-selection',
        image: 'salads',
        price: 95,
        veg: true,
        name: { fr: 'Salades marocaines', ar: 'تشكيلة السلطات المغربية', en: 'Moroccan salad selection' },
        desc: {
          fr: 'Sept petites salades cuites et crues selon le marché, à partager.',
          ar: 'سبع سلطات صغيرة مطبوخة وطازجة حسب السوق، للمشاركة.',
          en: 'Seven small cooked and raw salads from the market, to share.',
        },
      },
      {
        id: 'zaalouk',
        price: 55,
        veg: true,
        name: { fr: 'Zaalouk', ar: 'زعلوك', en: 'Zaalouk' },
        desc: {
          fr: 'Aubergines fumées, tomate, ail, cumin et huile d’olive.',
          ar: 'باذنجان مشوي على النار، طماطم، ثوم، كمون وزيت زيتون.',
          en: 'Smoky aubergine, tomato, garlic, cumin and olive oil.',
        },
      },
      {
        id: 'taktouka',
        price: 55,
        veg: true,
        name: { fr: 'Taktouka', ar: 'تكتوكة', en: 'Taktouka' },
        desc: {
          fr: 'Poivrons grillés et tomates confites au paprika doux.',
          ar: 'فلفل مشوي وطماطم مطهوة ببطء مع الفلفل الأحمر الحلو.',
          en: 'Grilled peppers and slow-cooked tomatoes with sweet paprika.',
        },
      },
      {
        id: 'harira',
        price: 45,
        name: { fr: 'Harira', ar: 'حريرة', en: 'Harira' },
        desc: {
          fr: 'Soupe de tomates, lentilles et pois chiches, servie avec dattes et chebakia.',
          ar: 'حساء الطماطم والعدس والحمص، يقدم مع التمر والشباكية.',
          en: 'Tomato, lentil and chickpea soup, served with dates and chebakia.',
        },
      },
      {
        id: 'meat-briouats',
        price: 65,
        name: { fr: 'Briouates à la viande', ar: 'بريوات باللحم', en: 'Meat briouats' },
        desc: {
          fr: 'Triangles croustillants à la viande hachée, herbes fraîches et épices douces.',
          ar: 'مثلثات مقرمشة محشوة باللحم المفروم والأعشاب الطازجة والتوابل.',
          en: 'Crisp pastry triangles filled with spiced minced meat and fresh herbs.',
        },
      },
    ],
  },
  {
    id: 'pastilla',
    image: 'spices',
    title: { fr: 'Pastillas', ar: 'البسطيلة', en: 'Pastillas' },
    imageAlt: {
      fr: 'Cônes d’épices colorées dans une échoppe du souk',
      ar: 'أهرامات من التوابل الملونة في دكان بالسوق',
      en: 'Cones of colourful spices in a souk stall',
    },
    items: [
      {
        id: 'chicken-and-almond-pastilla',
        price: 140,
        name: { fr: 'Pastilla au poulet et aux amandes', ar: 'بسطيلة الدجاج واللوز', en: 'Chicken and almond pastilla' },
        desc: {
          fr: 'Feuilles de warka, poulet confit aux épices, amandes, cannelle et sucre glace.',
          ar: 'أوراق الورقة، دجاج متبل، لوز، قرفة وسكر ناعم.',
          en: 'Warka pastry, spiced slow-cooked chicken, almonds, cinnamon and icing sugar.',
        },
      },
      {
        id: 'seafood-pastilla',
        price: 160,
        name: { fr: 'Pastilla aux fruits de mer', ar: 'بسطيلة فواكه البحر', en: 'Seafood pastilla' },
        desc: {
          fr: 'Crevettes, calamars et vermicelles à la chermoula.',
          ar: 'قمرون وكلمار وشعرية بالشرمولة.',
          en: 'Prawns, squid and vermicelli with chermoula.',
        },
      },
    ],
  },
  {
    id: 'tagines',
    image: 'tagine-lemon',
    title: { fr: 'Tajines', ar: 'الطواجن', en: 'Tagines' },
    imageAlt: {
      fr: 'Tajine de poulet aux pommes de terre et au citron dans son plat en terre',
      ar: 'طاجين الدجاج بالبطاطس والحامض في إنائه الفخاري',
      en: 'Chicken tagine with potatoes and lemon in its clay dish',
    },
    items: [
      {
        id: 'lamb-with-prunes-and-almonds',
        image: 'tagine-prunes',
        price: 175,
        name: { fr: 'Agneau aux pruneaux et amandes', ar: 'لحم الغنم بالبرقوق واللوز', en: 'Lamb with prunes and almonds' },
        desc: {
          fr: 'Épaule d’agneau mijotée, pruneaux au miel, amandes grillées et sésame.',
          ar: 'كتف غنم مطهو ببطء، برقوق بالعسل، لوز محمص وجلجلان.',
          en: 'Slow-cooked lamb shoulder, honeyed prunes, toasted almonds and sesame.',
        },
      },
      {
        id: 'chicken-with-preserved-lemon-and-olives',
        image: 'tagine-lemon',
        price: 145,
        name: { fr: 'Poulet au citron confit et olives', ar: 'دجاج بالحامض المرقد والزيتون', en: 'Chicken with preserved lemon and olives' },
        desc: {
          fr: 'Poulet fermier, citron confit maison, olives violettes et gingembre.',
          ar: 'دجاج بلدي، حامض مرقد منزلي، زيتون بنفسجي وزنجبيل.',
          en: 'Free-range chicken, house preserved lemon, purple olives and ginger.',
        },
      },
      {
        id: 'beef-with-pumpkin',
        image: 'tagine-pumpkin',
        price: 160,
        name: { fr: 'Bœuf au potiron', ar: 'لحم البقر بالقرع', en: 'Beef with pumpkin' },
        desc: {
          fr: 'Bœuf fondant, potiron rôti à la cannelle et coriandre fraîche.',
          ar: 'لحم بقر طري، قرع محمر بالقرفة وقزبر طري.',
          en: 'Tender beef, cinnamon-roasted pumpkin and fresh coriander.',
        },
      },
      {
        id: 'kefta-with-eggs',
        price: 120,
        name: { fr: 'Kefta aux œufs', ar: 'كفتة بالبيض', en: 'Kefta with eggs' },
        desc: {
          fr: 'Boulettes de bœuf épicées, sauce tomate au cumin, œufs cuits dans le tajine.',
          ar: 'كرات لحم متبلة، صلصة طماطم بالكمون، وبيض مطهو في الطاجين.',
          en: 'Spiced beef meatballs, cumin tomato sauce and eggs baked in the tagine.',
        },
      },
      {
        id: 'tangia-marrakchia',
        price: 185,
        name: { fr: 'Tangia marrakchia', ar: 'الطنجية المراكشية', en: 'Tangia marrakchia' },
        desc: {
          fr: 'Jarret de veau cuit huit heures dans une jarre en terre, citron confit et safran.',
          ar: 'لحم عجل مطهو ثماني ساعات في جرة فخارية، بالحامض المرقد والزعفران.',
          en: 'Veal shank cooked for eight hours in a clay jar, with preserved lemon and saffron.',
        },
      },
      {
        id: 'seasonal-vegetable-tagine',
        price: 115,
        veg: true,
        name: { fr: 'Tajine de légumes de saison', ar: 'طاجين خضر الموسم', en: 'Seasonal vegetable tagine' },
        desc: {
          fr: 'Légumes du marché, pois chiches et ras el hanout.',
          ar: 'خضر السوق، حمص ورأس الحانوت.',
          en: 'Market vegetables, chickpeas and ras el hanout.',
        },
      },
    ],
  },
  {
    id: 'couscous',
    image: 'couscous',
    title: { fr: 'Couscous', ar: 'الكسكس', en: 'Couscous' },
    imageAlt: {
      fr: 'Couscous aux légumes servi dans un plat décoré',
      ar: 'كسكس بالخضر في طبق مزخرف',
      en: 'Vegetable couscous served in a decorated dish',
    },
    items: [
      {
        id: 'seven-vegetable-couscous',
        image: 'couscous',
        price: 140,
        name: { fr: 'Couscous aux sept légumes', ar: 'كسكس بسبع خضار', en: 'Seven-vegetable couscous' },
        desc: {
          fr: 'Semoule roulée à la main, légumes de saison et bouillon parfumé. Le vendredi, comme à la maison.',
          ar: 'سميد مفتول باليد، خضر الموسم ومرق معطر. يوم الجمعة، كما في البيت.',
          en: 'Hand-rolled semolina, seasonal vegetables and fragrant broth. On Fridays, as at home.',
        },
      },
      {
        id: 'couscous-tfaya',
        price: 170,
        name: { fr: 'Couscous tfaya', ar: 'كسكس بالتفاية', en: 'Couscous tfaya' },
        desc: {
          fr: 'Agneau, oignons caramélisés aux raisins secs, cannelle et amandes.',
          ar: 'لحم غنم، بصل مكرمل بالزبيب، قرفة ولوز.',
          en: 'Lamb, onions caramelised with raisins, cinnamon and almonds.',
        },
      },
    ],
  },
  {
    id: 'desserts',
    image: 'pastries-tray',
    title: { fr: 'Desserts', ar: 'الحلويات', en: 'Desserts' },
    imageAlt: {
      fr: 'Plateau de pâtisseries marocaines aux amandes',
      ar: 'صينية حلويات مغربية باللوز',
      en: 'A tray of Moroccan almond pastries',
    },
    items: [
      {
        id: 'pastry-selection',
        image: 'pastries-tea',
        price: 55,
        veg: true,
        name: { fr: 'Assortiment de pâtisseries', ar: 'تشكيلة الحلويات', en: 'Pastry selection' },
        desc: {
          fr: 'Cornes de gazelle, ghriba et fekkas, préparées chaque matin.',
          ar: 'كعب غزال، غريبة وفقاص، تحضر كل صباح.',
          en: 'Gazelle horns, ghriba and fekkas, baked every morning.',
        },
      },
      {
        id: 'milk-pastilla',
        price: 60,
        veg: true,
        name: { fr: 'Pastilla au lait', ar: 'بسطيلة بالحليب', en: 'Milk pastilla' },
        desc: {
          fr: 'Feuilles croustillantes, crème à la fleur d’oranger et amandes grillées.',
          ar: 'أوراق مقرمشة، كريمة بماء الزهر ولوز محمص.',
          en: 'Crisp pastry layers, orange-blossom cream and toasted almonds.',
        },
      },
      {
        id: 'oranges-with-cinnamon',
        price: 40,
        veg: true,
        name: { fr: 'Oranges à la cannelle', ar: 'برتقال بالقرفة', en: 'Oranges with cinnamon' },
        desc: {
          fr: 'Oranges fraîches, eau de fleur d’oranger et cannelle.',
          ar: 'برتقال طازج، ماء الزهر وقرفة.',
          en: 'Fresh oranges, orange-blossom water and cinnamon.',
        },
      },
    ],
  },
  {
    id: 'drinks',
    image: 'tea-pour',
    title: { fr: 'Boissons', ar: 'المشروبات', en: 'Drinks' },
    imageAlt: {
      fr: 'Thé à la menthe versé de haut dans des verres remplis de feuilles de menthe',
      ar: 'أتاي بالنعناع يصب من الأعلى في كؤوس مليئة بأوراق النعناع',
      en: 'Mint tea poured from high into glasses filled with mint leaves',
    },
    items: [
      {
        id: 'mint-tea',
        image: 'tea-tray',
        price: 30,
        veg: true,
        name: { fr: 'Thé à la menthe', ar: 'أتاي بالنعناع', en: 'Mint tea' },
        desc: {
          fr: 'Thé vert et menthe fraîche, servi à la théière.',
          ar: 'شاي أخضر ونعناع طازج، يقدم في البراد.',
          en: 'Green tea and fresh mint, served by the pot.',
        },
      },
      {
        id: 'fresh-orange-juice',
        price: 30,
        veg: true,
        name: { fr: 'Jus d’orange pressé', ar: 'عصير برتقال طبيعي', en: 'Fresh orange juice' },
        desc: { fr: 'Pressé à la commande.', ar: 'يعصر عند الطلب.', en: 'Squeezed to order.' },
      },
      {
        id: 'avocado-and-date-shake',
        price: 45,
        veg: true,
        name: { fr: 'Jus d’avocat aux dattes', ar: 'عصير الأفوكادو بالتمر', en: 'Avocado and date shake' },
        desc: {
          fr: 'Avocat, lait, dattes et une touche de fleur d’oranger.',
          ar: 'أفوكادو، حليب، تمر ولمسة من ماء الزهر.',
          en: 'Avocado, milk, dates and a touch of orange blossom.',
        },
      },
      {
        id: 'spiced-coffee',
        price: 30,
        veg: true,
        name: { fr: 'Café aux épices', ar: 'قهوة بالتوابل', en: 'Spiced coffee' },
        desc: {
          fr: 'Café noir à la cannelle, cardamome et gingembre.',
          ar: 'قهوة سوداء بالقرفة والهيل والزنجبيل.',
          en: 'Black coffee with cinnamon, cardamom and ginger.',
        },
      },
    ],
  },
];
