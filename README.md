# directory-template
Create SEO optimized directory services using Codehooks.io as a backend

## Installation

1. Clone the repository:
```bash
git clone https://github.com/RestDB/directory-template
cd directory-template
```

2. If you don't have an account, sign up for an account at [Codehooks.io](https://account.codehooks.io/login?signup) and install the CLI:
```bash
npm install -g codehooks
```

3. Install dependencies:
```bash
npm install
```

4. Connect local project to your Codehooks.io project:
```bash
coho init --empty
```

## Setup with Mock Data

```bash
npm run mock
```

This command initializes your directory service with sample data from `bin/testdata-sneakers.json`. The mock data includes:

- Sneaker listings with detailed product information
- Categories like Nike, Adidas, Reebok, Puma, and Converse
- SEO-optimized content with keywords and descriptions
- Rich metadata including images, features, and specifications
- Hierarchical organization with categories and directories

Each listing contains:
- Title and SEO-friendly slug
- Category and directory classification (e.g., basketball, lifestyle, running)
- Detailed product specifications (materials, sole type, cushioning, etc.)
- Featured status indicators (topFeature, categoryFeature)
- High-quality product descriptions and ingress text
- Image URLs and website links
- Company name and brand information

The mock data creates a fully functional directory service, perfect for testing and development before adding your own content.

## Example directory sites built with this template

- [digihub.no](https://digihub.no)
- [alltoolz.dev](https://alltoolz.dev)

## Deployment

1. Deploy the backend to Codehooks.io:
```bash
npm run deploy
```

This command deploys both the backend service and the client application. After deployment:

1. Your service will be available at your project's auto-generated domain:
   ```
   https://your-project-name.codehooks.io
   ```
   (e.g., `https://rapid-fox-f20c.codehooks.io`)

2. The deployment includes:
   - Backend API endpoints for managing listings
   - Frontend client application with complete UI
   - Sample data (if you ran the mock setup)
   - SEO-optimized pages for all listings

Visit your project's domain to see the live directory service in action.

## Create automatic screenshots
There's a utility tool that let's you create a screenshot for each url in the database.

Run this command to create a local folder `~/tmp/screenshots` of screenshots:
```
npm run screenshot  
```

This may take a while - grab a coffee or tea ☕️.

After the local screenshots have been created, you may upload all to the Codehooks blob storage with this command:

```
npm run uploadscreenshots
```

This may also take some time - refill your cup ☕️.

## UI Customization

This project uses [DaisyUI](https://daisyui.com/) and [Tailwind CSS](https://tailwindcss.com/) for styling.

### DaisyUI Theme Customization

The theme configuration is managed in `web/css/input.css` using DaisyUI's plugin syntax:

```css
@plugin "daisyui" {
    themes: light --default, dark, night;
}
```

This configuration:
- Sets `light` as the default theme
- Includes `dark` and `night` themes as alternatives
- Users can switch between these themes using DaisyUI's theme change utilities

To modify available themes:
1. Edit the themes list in `web/css/input.css`
2. Choose from [DaisyUI's built-in themes](https://daisyui.com/docs/themes/)
3. You can also add custom themes following DaisyUI's theming guidelines

### Tailwind CSS Customization

1. Extend or modify Tailwind's default configuration in `tailwind.config.js`:
```javascript
module.exports = {
  theme: {
    extend: {
      spacing: {
        '128': '32rem',
      },
      colors: {
        'custom-blue': '#1234567',
      },
      // Add more customizations
    },
  },
}
```

2. Use custom classes in your components:
```jsx
<div className="text-custom-blue p-128">
  Custom styled content
</div>
```

## NPM commands in package.json

The project includes several useful NPM commands for development and deployment:

### Development Commands
- `npm run clean` - Cleans the database by dropping the 'listings' collection and clearing the cache
- `npm run mock` - Initializes the database with sample sneaker data from `bin/testdata-sneakers.json`
- `npm run css` - Generates CSS files using Tailwind CSS
- `npm run bundle` - Bundles and minifies client-side JavaScript using esbuild
- `npm run clearcache` - Clears the Codehooks.io cache

### Build Commands
- `npm run build` - Creates the build directory, generates CSS, and builds the search index
- `npm run buildindex` - Generates the search index from the database listings
- `npm run buildsitemap` - Generates the sitemap for the website

### Screenshot Commands
- `npm run screenshot` - Creates screenshots of all listings and saves them to `~/tmp/screenshots`
- `npm run uploadscreenshots` - Uploads the generated screenshots to Codehooks.io blob storage

### Deployment Commands
- `npm run deploy` - Builds the project, bundles JavaScript, clears cache, and deploys to Codehooks.io

### Setup Commands
- `npm run setup` - Cleans the database, creates the listings collection, and imports data from `build/output.json`

## Learn More

- [Codehooks.io Documentation](https://codehooks.io/docs)
- [DaisyUI Documentation](https://daisyui.com/docs/install/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)


