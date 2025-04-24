/*
* Codehooks (c) example
* A directory web site with dynamic content
*/
import {app, Datastore, filestore} from 'codehooks-js'
import handlebars from 'handlebars';
import {URL} from 'url';
import fetch from 'node-fetch';
import layouts from 'handlebars-layouts';
import about from './web/templates/about.hbs';
import contact from './web/templates/contact.hbs';
import account from './web/templates/account.hbs';
import index from './web/templates/index.hbs';
import all from './web/templates/all.hbs';
import category from './web/templates/category.hbs';
import listing from './web/templates/listing.hbs';  
import layout from './web/templates/layout.hbs';
import bigbrands from './web/templates/bigbrands.hbs';
import { 
    loadDirectoriesCached, 
    loadTopFeaturesCached, 
    loadAllCategoriesCached, 
    loadCategoryFeaturesCached,
    loadListingById,
    writeSitemapToResponse,
    setCacheHeaders,
    loadBigBrandsCached
} from './helpers.js';
import settings from './settings.js';

// Define the page templates
const templates = {
    about: handlebars.compile(about),
    contact: handlebars.compile(contact),
    account: handlebars.compile(account),
    index: handlebars.compile(index),
    all: handlebars.compile(all),
    category: handlebars.compile(category),
    listing: handlebars.compile(listing),
    layout: handlebars.compile(layout),
    bigbrands: handlebars.compile(bigbrands)
}

const bigBrandsArray = settings.brands;

// Render the page
const renderPage = async (page, data) => {
    /*const db = await Datastore.open();
    const cache = await db.get(`pagecache-${page}`);
    if (cache) {
        console.log(`Cache hit for ${page}`);
        return cache;
    }*/
    const content = templates[page](data);
    //await db.set(`pagecache-${page}`, content, {ttl: 1000*60*60});
    return content;
}

// Setting up the page views and layout template
handlebars.registerHelper(layouts(handlebars));
handlebars.registerPartial('layout', layout);

// cache breaker variable
let cacheBreaker = process.env.CACHE_BREAKER || '0';

// crudlify listings collection
const listingJSONSchema = {
    title: {type: 'string', required: true},
    siteUrl: {type: 'string', required: true},
    screenshot: {type: 'string', required: false}
}
app.crudlify({'listings': null}, {prefix: '/api'});


// render the index page
app.get('/', async (req, res) => {
    const directories = await loadDirectoriesCached();
    const topFeatures = await loadTopFeaturesCached();
    //setCacheHeaders(res);
    res.send(await renderPage('index', {directories, topFeatures, title: settings.title, ingress: settings.ingress, cacheBreaker}));
});

// Generate sitemap.xml
app.get('/sitemap.xml', async (req, res) => {
    await writeSitemapToResponse(res, req.headers.host);
});


// serve a screenshot of a url
app.get('/screenshot', async (req, res) => {
    const url = req.query.url;
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname === '/' ? '' : parsedUrl.pathname;
    const filename = `${parsedUrl.hostname}${pathname.replace(/\//g, '_')}.png`;
    console.log('serve a screenshot of a url', url, filename);
    try {
        setCacheHeaders(res);
        const filestream = await filestore.getReadStream(`/screenshots/${filename}`);        
        res.set('content-type', 'image/png');
        // stream content back to client    
        filestream
        .on('data', (buf) => {
          res.write(buf, 'buffer')
        })    
        .on('end', () => {
          res.end()
        })
        
      } catch (error) {
        console.error(error)
        res.set('content-type', 'image/svg+xml');
        // Create an SVG with "Missing screenshot" text
        const missingImageBuffer = Buffer.from(`
            <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
                <rect width="800" height="600" fill="#f5f5f5"/>
                <text 
                    x="400" 
                    y="300" 
                    font-family="Arial" 
                    font-size="32" 
                    fill="#666"
                    text-anchor="middle" 
                    dominant-baseline="middle">
                    ║  No screenshot available   ║ 
                </text>
            </svg>
        `);
        
        res.write(missingImageBuffer, 'buffer');
        res.end();
      }
});

// load contact
app.get('/contact', async (req, res) => {
    console.log('contact');
    const directories = await loadDirectoriesCached();
    res.send(await renderPage('contact', {directories, title: settings.title, cacheBreaker}));
});

// load about
app.get('/about', async (req, res) => {
    console.log('about');
    const directories = await loadDirectoriesCached();
    res.send(await renderPage('about', {directories, title: settings.title, cacheBreaker}));
});

// load bigbrands
// Oracle, Microsoft, OpenAI, Meta, Ibm, Google, GitHub, Amazon, Cloudflare
app.get('/bigbrands', async (req, res) => {
    const directories = await loadDirectoriesCached();
    const bigBrands = await loadBigBrandsCached(bigBrandsArray);
    console.log('bigBrands', bigBrands);    
    res.send(await renderPage('bigbrands', {directories, bigBrands, title: settings.title, cacheBreaker}));
});

// load all categories
app.get('/listing/all', async (req, res) => {
    const directories = await loadDirectoriesCached();
    const allCategories = await loadAllCategoriesCached();
    res.send(await renderPage('all', {directories, allCategories, title: settings.title, cacheBreaker}));
});

// load category by slug
app.get('/listing/:slug', async (req, res) => {
    const {slug} = req.params;
    const directories = await loadDirectoriesCached();
    const categoryFeatures = await loadCategoryFeaturesCached(slug);    
    res.send(await renderPage('category', {directories, categoryFeatures, category: slug, title: settings.title, cacheBreaker}));
});

// load listing by slug and id
app.get('/listing/:categorySlug/:slug', async (req, res) => {
    const {categorySlug, slug} = req.params;
    try {
        const directories = await loadDirectoriesCached();
        console.log('loadListingByIdCached', slug, directories.length);
        const listing = await loadListingById(slug);
        res.send(await renderPage('listing', {listing, directories, category: categorySlug, keywords: listing.seoKeywords, title: settings.title, cacheBreaker}));
    } catch (error) {
        console.error(`Error loading listing ${slug}:`, error.message);
        res.status(404).send('Listing not found'+encodeURIComponent(slug));
    }
});

// load account
app.get('/account', async (req, res) => {
    console.log('account');    
    const directories = await loadDirectoriesCached();
    res.send(await renderPage('account', {directories, title: settings.title, cacheBreaker}));
});


// Define the authentication middleware for open pages
app.auth('/*', (req, res, next) => {
    if (req.method === 'GET') {
        console.log('auth OK', req.originalUrl);
        next()
    } else {
        console.log('auth NOT OK', req.originalUrl);
        res.status(401).end('Unauthorized');
    }
    
});

// load static files (client cache)
app.static({route: "/", directory: "/web", notFound: "/404.html"}, (_, res, next) => {
    setCacheHeaders(res);
    next();
})


// bind to serverless runtime
export default app.init(async () => {
    console.log('app.init');
    const db = await Datastore.open();
    // create index for slug
    db.createIndex('listings', ['slug']);
});