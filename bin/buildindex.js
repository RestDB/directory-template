const lunr = require('lunr'),
    fs = require('fs');

// Read and parse the JSON file
const documents = JSON.parse(fs.readFileSync('build/database-listings.json', 'utf8'))
const showHitsData = {}

const idx = lunr(function () {
     
    this.ref('_id')
    this.field('title')
    this.field('content')
    this.field('category')
    this.field('siteUrl')    
    this.field('companyName')
    this.field('details', {
        extractor: doc => doc.details?.map(detail => `${detail.label} ${detail.value}`).join(' ')
    })

    

    documents.forEach(function (doc) {        
        this.add(doc)
        showHitsData[doc._id] = {
            title: doc.title,
            siteUrl: doc.siteUrl,
            altImageUrl: doc.altImageUrl,
            content: doc.content,
            category: doc.category,
            categorySlug: doc.categorySlug,
            slug: doc.slug,
            companyName: doc.companyName,
            details: doc.details
        }
    }, this)
})

const serialized = JSON.stringify(idx)
fs.writeFileSync('web/js/lunr-index.json', serialized)
fs.writeFileSync('web/js/show-hits-data.json', JSON.stringify(showHitsData))