import { Datastore } from 'codehooks-js'
import handlebars from 'handlebars';
import bannerAd from './web/templates/ad1.hbs';
const CACHE_ON = true;
const ONE_HOUR = 1000*60*60;
const ONE_MONTH = 1000*60*60*24*30;

const compiled = handlebars.compile(bannerAd);

// Cache helper
async function getCached(key, loader, ttl = ONE_HOUR) {
    if (!CACHE_ON) return await loader();
    const db = await Datastore.open();
    const cached = await db.get(`cache-${key}`, {keyspace: 'cache'});
    
    if (cached) {
        console.log(`Cache hit for db ${key}`);
        return JSON.parse(cached);
    }

    const data = await loader();
    await db.set(`cache-${key}`, JSON.stringify(data), {ttl: ttl, keyspace: 'cache'});
    return data;
}

// Data loaders
async function loadTopFeatures() {
    const db = await Datastore.open();  
    return db.getMany('listings', { topFeature: true }).toArray();
}

async function loadCategoryFeatures(categorySlug) {
    const db = await Datastore.open();
    return db.getMany('listings', { categorySlug }).toArray();
}

async function loadListingById(slug) {
    /*return new Promise(async (resolve, reject) => {
        const db = await Datastore.open();
        console.log('loadListingById', slug);
        const listing = await db.getMany('listings', {slug}, {limit: 1}).toArray();
        if (listing.length > 0) {
            resolve(listing[0]);
        } else {
            reject(new Error('Listing not found'));
        }
    });*/
    const db = await Datastore.open();
    return db.getOne('listings', {slug});
}

async function loadDirectories() {
    const db = await Datastore.open();
    const cursor = db.getMany('listings', {}, {
        hints: { $fields: {directory: 1, category: 1, categorySlug: 1} }
    });
    
    const directories = {};
    let totalCount = 0;
    
    await cursor.forEach((item) => {
        if (!directories[item.categorySlug]) {
            directories[item.categorySlug] = {name: item.category, count: 0, categorySlug: item.categorySlug};
        }
        directories[item.categorySlug].name = item.category;
        directories[item.categorySlug].count++;
        totalCount++;
    });
    
    directories['all'] = {name: 'All categories', count: totalCount, categorySlug: 'all'};
    
    return Object.values(directories).sort((a, b) => {
        if (a.categorySlug === 'all') return -1;
        if (b.categorySlug === 'all') return 1;
        return a.name.localeCompare(b.name);
    });
}

async function loadAllCategories() {
    const db = await Datastore.open();    
    const result = await db.getMany('listings', {}).toArray();
    return result.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});
}

async function loadBigBrands(brandsArray) {
    const db = await Datastore.open();
    const result = await db.getMany('listings', {companyName: {$in: brandsArray}}).toArray();
    // group by companyName
    return result.reduce((acc, item) => {
        if (!acc[item.companyName]) {
            acc[item.companyName] = {
                name: item.companyName,
                products: []
            };
        }
        acc[item.companyName].products.push(item);
        return acc;
    }, {});
}

// Cached versions
const loadDirectoriesCached = () => getCached('directories', loadDirectories);
const loadTopFeaturesCached = () => getCached('topFeatures', loadTopFeatures);
const loadAllCategoriesCached = () => getCached('allCategories', loadAllCategories);
const loadCategoryFeaturesCached = (slug) => getCached(`categoryFeatures-${slug}`, () => loadCategoryFeatures(slug));
const loadListingByIdCached = (slug) => getCached(`listing-${slug}`, () => loadListingById(slug));
const loadBigBrandsCached = (brandsArray) => getCached(`bigBrands-${brandsArray.join(',')}`, () => loadBigBrands(brandsArray));
// Generate sitemap XML directly to response
async function writeSitemapToResponse(res, host) {
    const db = await Datastore.open();
    const sitename = `https://${host}`;
    const listings = db.getMany('listings');
    
    res.setHeader('Content-Type', 'application/xml');
    
    res.write('<?xml version="1.0" encoding="UTF-8"?>\n');
    res.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n');
    
    // Add root URL
    res.write(`  <url>
    <loc>${sitename}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>\n`);
    
    // Add all categories page
    res.write(`  <url>
    <loc>${sitename}/category/all</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>\n`);
    
    // Add all directory entries
    await listings.forEach((listing) => {
        res.write(`  <url>
    <loc>${sitename}/listing/${listing.categorySlug}/${listing.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`);
    });
    
    res.write('</urlset>');
    res.end();
}

// Register banner ad helper
handlebars.registerHelper('bannerAd', function(options) {
    const { link, image, text, linkText, title  } = options.hash;
    try {        
        const adstr = compiled({ link, image, text, linkText, title });
        return new handlebars.SafeString(adstr);
    } catch (err) {
        console.error('Error compiling banner ad:', err);
        return '';
    }
});

// Register the equals Handlebarshelper
handlebars.registerHelper('eq', function(a, b, options) {
    // Get the optional ignoreCase parameter, defaults to false
    const ignoreCase = options.hash.ignoreCase || false;
    
    if (ignoreCase && typeof a === 'string' && typeof b === 'string') {
        return a.toLowerCase() === b.toLowerCase();
    }
    
    return a === b;
});

const setCacheHeaders = (res) => {
    console.log('If you see this, the client cache is invalidated or called for the first time');        
    res.set('Cache-Control', `public, max-age=2592000, s-maxage=2592000`);
    res.setHeader("Expires", new Date(Date.now() + ONE_MONTH).toUTCString());
    //res.set('Vary', '*');
    res.removeHeader('Pragma');
}

// Export the new function along with existing exports
export { setCacheHeaders, writeSitemapToResponse, loadDirectoriesCached, loadTopFeaturesCached, loadAllCategoriesCached, loadCategoryFeaturesCached, loadListingByIdCached, loadListingById, loadBigBrandsCached }; 