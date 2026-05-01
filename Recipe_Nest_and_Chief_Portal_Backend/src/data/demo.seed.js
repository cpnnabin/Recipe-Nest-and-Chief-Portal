const AUTH_COPY = {
    brand: "Recipe Nest",
    subtitle: "Nepali Khana ko Sansar",
    caption: "(Nepali Food World)",
    features: [
        {
            title: "Discover Recipes",
            text: "Momo dekhi Dal Bhat samma sabai",
        },
        {
            title: "Share Recipes",
            text: "Aafno recipe share garnus",
        },
        {
            title: "Join Community",
            text: "Nepali food lovers sanga judnu",
        },
    ],
};

const AUTH_MESSAGES = {
    loginFailed: "Invalid email or password.",
    registerFailed: "Email already registered.",
    passwordMismatch: "Passwords do not match.",
};

const AUTH_USERS_SEED = [
    {
        id: "chif-portal-1",
        fullName: "Nabin Dhakal",
        email: "nabinclint@gmail.com",
        password: "Nabin@123",
        portal: "Chif Portal",
        role: "chief",
    },
    {
        id: "recipe-nest-1",
        fullName: "Nabin Dhakal",
        email: "nabinrepipe@gmail.com",
        password: "Nabin@123",
        portal: "Recipe Nest",
        role: "customer",
    },
];

const dashboardStats = [
    { id: "created", value: "8", label: "Recipes Created" },
    { id: "saved", value: "24", label: "Saved Recipes" },
    { id: "views", value: "2.4k", label: "Total Views" },
    { id: "followers", value: "156", label: "Followers" },
];

const profileStats = [
    { id: "posted", value: "8", label: "Recipes Posted" },
    { id: "bookmarks", value: "24", label: "Bookmarks" },
    { id: "following", value: "89", label: "Following" },
];

const profileRatings = [4.9, 4.8, 4.7, 4.8];

const savedRecipesSeed = [
    {
        id: "momo",
        title: "Chicken Momo",
        tag: "Nasta (Breakfast)",
        time: "30 min",
        image:
            "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=800&q=80",
    },
    {
        id: "dal-bhat",
        title: "Dal Bhat with Tarkari",
        tag: "Khana (Main Dish)",
        time: "15 min",
        image:
            "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
    },
    {
        id: "sel-roti",
        title: "Sel Roti",
        tag: "Mitho (Dessert)",
        time: "8 hours (soaking)",
        image:
            "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80",
    },
];

const featuredRecipes = [
    {
        id: "featured-momo",
        title: "Chicken Momo",
        tag: "Nasta (Breakfast)",
        time: "30 min",
        level: "Easy",
        image: savedRecipesSeed[0].image,
    },
    {
        id: "featured-bhat",
        title: "Dal Bhat with Tarkari",
        tag: "Khana (Main Dish)",
        time: "15 min",
        level: "Medium",
        image: savedRecipesSeed[1].image,
    },
    {
        id: "featured-roti",
        title: "Sel Roti",
        tag: "Mitho (Dessert)",
        time: "8 hours (soaking)",
        level: "Hard",
        image: savedRecipesSeed[2].image,
    },
];

const recentActivitySeed = [
    {
        id: "a1",
        title: "Chicken Momo",
        tag: "Nasta (Breakfast)",
        time: "Viewed 2 hours ago",
        image: savedRecipesSeed[0].image,
    },
    {
        id: "a2",
        title: "Dal Bhat with Tarkari",
        tag: "Khana (Main Dish)",
        time: "Viewed 2 hours ago",
        image: savedRecipesSeed[1].image,
    },
    {
        id: "a3",
        title: "Sel Roti",
        tag: "Mitho (Dessert)",
        time: "Viewed 2 hours ago",
        image: savedRecipesSeed[2].image,
    },
];

const profileSeed = {
    fullName: "Sita Gurung",
    subtitle: "Food enthusiast | Home cook | Recipe creator",
    email: "sita@recipenest.com",
    role: "Home Chef",
    location: "Kathmandu, Nepal",
    description: "Edit Profile",
};

const adminAnalyticsSeed = {
    title: "ChifPortal",
    subtitle: "Analytics",
    description: "Detailed analytics and insights",
    adminName: "Admin User",
    adminEmail: "admin@recipenest.com",
    month: "Feb",
    monthlyGrowth: [
        { label: "Jan", recipes: 900, users: 550, reviews: 300 },
        { label: "Feb", recipes: 1400, users: 1050, reviews: 700 },
        { label: "Mar", recipes: 1200, users: 900, reviews: 500 },
        { label: "Apr", recipes: 1500, users: 1150, reviews: 850 },
        { label: "May", recipes: 1700, users: 1280, reviews: 920 },
        { label: "Jun", recipes: 1800, users: 1400, reviews: 960 },
    ],
    metrics: [
        { id: "recipes", value: "1400", label: "Recipes" },
        { id: "categories", value: "1050", label: "Categories" },
        { id: "users", value: "700", label: "Users" },
    ],
    insights: [
        { id: "rating", value: "4.7", label: "Avg. Recipe Rating", note: "↑ 0.3 from last month" },
        { id: "retention", value: "78%", label: "User Retention", note: "↑ 5% from last month" },
        { id: "time", value: "12m", label: "Avg. Time on Site", note: "↑ 2m from last month" },
        { id: "bounce", value: "23%", label: "Bounce Rate", note: "↑ 1% from last month" },
    ],
    engagement: {
        max: 60000,
        ticks: [0, 15000, 30000, 45000, 60000],
        series: [
            { label: "Recipe Saves", value: 60000 },
            { label: "Shares", value: 45000 },
            { label: "Reviews Posted", value: 30000 },
        ],
    },
    distribution: [
        { label: "Mobile", value: "62%" },
        { label: "Tablet", value: "10%" },
        { label: "Desktop", value: "28%" },
    ],
};

const seedCategories = [
    { name: "Breakfast", slug: "breakfast", description: "Morning meals and light starters" },
    { name: "Lunch", slug: "lunch", description: "Filling midday meals" },
    { name: "Dinner", slug: "dinner", description: "Evening main courses" },
    { name: "Snack", slug: "snack", description: "Quick bites and street food" },
    { name: "Dessert", slug: "dessert", description: "Sweet dishes and treats" },
];

const seedRecipes = [
    {
        title: "Chicken Momo",
        description: "Juicy steamed chicken momos with a spicy tomato achar served hot.",
        image: savedRecipesSeed[0].image,
        ingredients: [
            { name: "Chicken mince", quantity: "500", unit: "g" },
            { name: "Flour", quantity: "3", unit: "cups" },
            { name: "Onion", quantity: "1", unit: "large" },
            { name: "Ginger garlic paste", quantity: "1", unit: "tbsp" },
        ],
        instructions: [
            "Mix the chicken mince with onions, spices, and salt.",
            "Knead the dough and roll into small wrappers.",
            "Fill and fold the momos, then steam for 12 to 15 minutes.",
        ],
        prep_time: 20,
        cook_time: 15,
        servings: 4,
        difficulty_level: "easy",
        calories: 320,
        categoryName: "breakfast",
        cuisine: "Nepali",
        dietType: ["halal"],
        tags: ["momo", "steamed", "street food"],
        tips: ["Serve immediately with achar for best taste."],
        equipment: ["Mixing bowl", "Steamer"],
        view_count: 1280,
        average_rating: 4.8,
        isFeatured: true,
    },
    {
        title: "Dal Bhat with Tarkari",
        description: "Classic Nepali comfort meal with lentil soup, rice, and seasonal vegetable curry.",
        image: savedRecipesSeed[1].image,
        ingredients: [
            { name: "Lentils", quantity: "1", unit: "cup" },
            { name: "Rice", quantity: "2", unit: "cups" },
            { name: "Mixed vegetables", quantity: "2", unit: "cups" },
            { name: "Mustard oil", quantity: "2", unit: "tbsp" },
        ],
        instructions: [
            "Cook the lentils with turmeric and aromatics until soft.",
            "Prepare rice and seasonal vegetable curry.",
            "Serve everything hot on a plate with achar.",
        ],
        prep_time: 10,
        cook_time: 30,
        servings: 4,
        difficulty_level: "medium",
        calories: 540,
        categoryName: "lunch",
        cuisine: "Nepali",
        dietType: ["vegetarian"],
        tags: ["dal bhat", "comfort food"],
        tips: ["Add ghee for a richer flavor."],
        equipment: ["Pot", "Pan"],
        view_count: 980,
        average_rating: 4.7,
        isFeatured: true,
    },
    {
        title: "Sel Roti",
        description: "Traditional sweet ring-shaped rice bread enjoyed during festivals and tea time.",
        image: savedRecipesSeed[2].image,
        ingredients: [
            { name: "Rice", quantity: "2", unit: "cups" },
            { name: "Sugar", quantity: "1/2", unit: "cup" },
            { name: "Milk", quantity: "1", unit: "cup" },
            { name: "Cardamom", quantity: "1", unit: "tsp" },
        ],
        instructions: [
            "Soak rice overnight and grind into a smooth batter.",
            "Mix with sugar, milk, and cardamom.",
            "Deep fry the batter into ring shapes until golden brown.",
        ],
        prep_time: 480,
        cook_time: 20,
        servings: 6,
        difficulty_level: "hard",
        calories: 410,
        categoryName: "dessert",
        cuisine: "Nepali",
        dietType: ["vegetarian"],
        tags: ["festival", "sweet", "traditional"],
        tips: ["Use medium heat so the sel roti cooks evenly."],
        equipment: ["Deep pan", "Whisk"],
        view_count: 1560,
        average_rating: 4.9,
        isFeatured: true,
    },
];

const seedReviews = [
    {
        recipeTitle: "Chicken Momo",
        authorEmail: "nabinrepipe@gmail.com",
        comment: "Best momo recipe I have tried so far.",
        rating: 5,
    },
    {
        recipeTitle: "Dal Bhat with Tarkari",
        authorEmail: "nabinclint@gmail.com",
        comment: "Simple and comforting, perfect for daily lunch.",
        rating: 4,
    },
    {
        recipeTitle: "Sel Roti",
        authorEmail: "nabinrepipe@gmail.com",
        comment: "Very authentic festival style sel roti.",
        rating: 5,
    },
];

const seedBookmarks = [];

module.exports = {
    AUTH_COPY,
    AUTH_MESSAGES,
    AUTH_USERS_SEED,
    dashboardStats,
    profileStats,
    profileRatings,
    savedRecipesSeed,
    featuredRecipes,
    recentActivitySeed,
    profileSeed,
    adminAnalyticsSeed,
    seedCategories,
    seedRecipes,
    seedReviews,
    seedBookmarks,
};

