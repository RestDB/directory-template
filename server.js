/*
* Codehooks (c) example
* A simple web site
*/
import {app, Datastore, aggregation} from 'codehooks-js'
import handlebars from 'handlebars';
import layouts from 'handlebars-layouts';
import about from './web/templates/about.hbs';
import contact from './web/templates/contact.hbs';
import account from './web/templates/account.hbs';
import index from './web/templates/index.hbs';
import all from './web/templates/all.hbs';
import category from './web/templates/category.hbs';
import listing from './web/templates/listing.hbs';  
import layout from './web/templates/layout.hbs';

const templates = {
    about: handlebars.compile(about),
    contact: handlebars.compile(contact),
    account: handlebars.compile(account),
    index: handlebars.compile(index),
    all: handlebars.compile(all),
    category: handlebars.compile(category),
    listing: handlebars.compile(listing),
    layout: handlebars.compile(layout)
}

// Setting up the page views and layout template
handlebars.registerHelper(layouts(handlebars));
handlebars.registerPartial('layout', layout);


app.auth(/^\/(index|category|account|contact|about\/.*)?$/, (req, res, next) => { next() });

const rand = () => Math.random();

// Helper function to filter data based on category
const filterByCategory = (items, category) => {
    return items.filter(item => item.category === category);
};

// Add new helper function to filter featured items
const loadTopFeatures = async () => {
    const db = await Datastore.open();  
    const cursor = db.getMany('listings', 
        {
            topFeature: true
        }
    );
    return cursor.toArray();
};
// Add new helper function to filter category features
const loadCategoryFeatures = async (categorySlug) => {
    const db = await Datastore.open();
    const cursor = db.getMany('listings', 
        {
            categoryFeature: true,
            categorySlug: categorySlug
        }
    );
    return cursor.toArray();
};

// load listing by id
const loadListingById = async (id) => {
    const db = await Datastore.open();
    const listing = await db.getOne('listings', {_id: id});
    //console.log('listing', listing);
    return listing;
};

const loadDirectories = async () => {
    const db = await Datastore.open();
    const cursor = db.getMany('listings', 
        {
            /* all items */
        }, 
        {
            hints: {
                $fields: {directory: 1, category: 1, categorySlug: 1}
            }
        }
    );
    const directories = {};
    let totalCount = 0;  // Add counter variable
    await cursor.forEach((item) => {
        if (!directories[item.categorySlug]) {
            directories[item.categorySlug] = {name: item.category, count: 0, categorySlug: item.categorySlug};
        }
        directories[item.categorySlug].name = item.category;
        directories[item.categorySlug].count++;
        totalCount++;  // Increment total count
    })
    // insert a new item for all categories with the total count
    directories['all'] = {name: 'All categories', count: totalCount, categorySlug: 'all'};
    return Object.values(directories).sort((a, b) => b.count - a.count);
};

const loadAllCategories = async () => {
    const db = await Datastore.open();    
    const result = await db.getMany('listings', {}).toArray();
    // group by category, storing the full items
    const categories = result.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {});
    return categories;
};

// Defining routes and page template to render for different pages
app.get('/', async (req, res) => {
    const directories = await loadDirectories();
    const topFeatures = await loadTopFeatures();
    res.send(templates.index({directories, topFeatures, rand: rand()}));
});

app.get('/category/all', async (req, res) => {
    const directories = await loadDirectories();
    const allCategories = await loadAllCategories();
    res.send(templates.all({directories, allCategories, rand: rand()}));
});

app.get('/category/:slug', async (req, res) => {
    const {slug} = req.params;
    const directories = await loadDirectories();
    const categoryFeatures = await loadCategoryFeatures(slug);    
    res.send(templates.category({directories, categoryFeatures, category: slug, rand: rand()}));
});

app.get('/listing/:slug/:id', async (req, res) => {
    const {slug, id} = req.params;
    const directories = await loadDirectories();
    const listing = await loadListingById(id);
    res.send(templates.listing({listing, directories, rand: rand()}));
});

app.get('/account', async (req, res) => {
    console.log('account');
    const directories = await loadDirectories();
    res.send(templates.account({directories, rand: rand()}));
});

app.get('/contact', async (req, res) => {
    console.log('contact');
    const directories = await loadDirectories();
    res.send(templates.contact({directories, rand: rand()}));
});

app.get('/about', async (req, res) => {
    console.log('about');
    const directories = await loadDirectories();
    res.send(templates.about({directories, rand: rand()}));
});

app.static({route: "/", directory: "/web", notFound: "/404.html"}, (_, res, next) => {
    console.log('If you see this, the client cache is invalidated or called for the first time');
    const ONE_HOUR =  1000*60*60;
    res.set('Cache-Control', `public, max-age=${ONE_HOUR}, s-maxage=${ONE_HOUR}`);
    res.setHeader("Expires", new Date(Date.now() + ONE_HOUR).toUTCString());
    res.removeHeader('Pragma');
    next();
  })

// bind to serverless runtime
export default app.init();