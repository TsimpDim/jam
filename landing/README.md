# JAM! Landing Page

Welcome to the JAM! landing page - a static website designed to showcase the Job Application Manager service.

## 📁 Structure

```
jam-landing/
├── index.html          # Main landing page
├── css/
│   └── styles.css      # Complete responsive stylesheet
├── js/
│   └── main.js         # Interactive features and animations
├── pages/              # Additional pages
│   ├── company.html    # About the company
│   ├── contact.html    # Contact form and information
│   ├── privacy.html    # Privacy policy
│   └── terms.html      # Terms of service
└── images/             # (Empty - add your images here)
```

## 🎨 Design Features

### Brand Colors

- **Primary Color**: `#320047` (Deep purple - matches JAM! client design)
- **Font**: Inter (Google Fonts)
- **Style**: Modern, clean, professional

### Key Sections

1. **Hero Section** - Eye-catching headline with clear CTA
2. **Stats Section** - Credibility through numbers
3. **Features Grid** - 9 key features with icons
4. **How It Works** - 4-step process
5. **Benefits** - Why choose JAM!
6. **Pricing** - 3-tier pricing (Free, Pro, Team)
7. **Final CTA** - Strong conversion push
8. **Footer** - Links to all important pages

## 🚀 Features

### Responsive Design

- ✅ Mobile-first approach
- ✅ Tablet optimization (768px+)
- ✅ Desktop layouts (1024px+)
- ✅ Large screens (1200px+)

### Interactivity

- Smooth scroll navigation
- Mobile hamburger menu
- Animated scroll effects
- Counter animations for stats
- Card hover effects
- Sticky navigation with scroll effects
- Intersection Observer for lazy animations

### Browser Extension Ready

- Links prepared for `/login` and `/register` routes
- Can be integrated with your JAM! API

## 🛠️ Setup & Deployment

### Local Development

Simply open `index.html` in a browser:

```bash
cd jam-landing
# Open with a local server (recommended)
python3 -m http.server 8080
# Or use any local server
```

Then visit: `http://localhost:8080`

### Production Deployment

#### Option 1: Static Hosting (Netlify, Vercel, GitHub Pages)

1. Push the `jam-landing` directory to your repository
2. Connect to your hosting service
3. Set the publish directory to `jam-landing`
4. Deploy!

#### Option 2: Nginx

```nginx
server {
    listen 80;
    server_name landing.jam-app.com;
    root /path/to/jam-landing;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

#### Option 3: AWS S3 + CloudFront

1. Upload files to S3 bucket
2. Enable static website hosting
3. Configure CloudFront distribution
4. Point your domain

## 🔗 Integration with JAM! App

### Update Links

The landing page has placeholder links that need to be updated:

1. **Login/Register buttons**: Currently point to `/login` and `/register`

   - Update to your actual JAM! client URLs (e.g., `https://app.jam-app.com/login`)

2. **Social links**: Update footer social links with actual profiles

3. **Email addresses**: Replace placeholder emails:
   - `support@jam-app.com`
   - `privacy@jam-app.com`
   - `legal@jam-app.com`
   - `enterprise@jam-app.com`

### Contact Form

The contact form currently shows an alert. To make it functional:

```javascript
// In pages/contact.html, replace the handleSubmit function:
function handleSubmit(event) {
  event.preventDefault();

  // Send to your backend
  fetch("YOUR_API_ENDPOINT/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      subject: document.getElementById("subject").value,
      message: document.getElementById("message").value,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      alert("Thank you! We'll get back to you soon.");
      document.getElementById("contactForm").reset();
    })
    .catch((error) => {
      alert("Sorry, something went wrong. Please try again.");
    });

  return false;
}
```

## 📝 Customization

### Add Your Logo

Replace the text logo with an image:

```html
<!-- In navbar -->
<div class="nav-brand">
  <img src="images/logo.png" alt="JAM!" class="logo" />
</div>
```

### Add Screenshots/Images

1. Add images to the `images/` directory
2. Update the hero section:

```html
<div class="hero-image">
  <img src="images/dashboard-screenshot.png" alt="JAM! Dashboard" />
</div>
```

### Update Statistics

Edit the stats in `index.html`:

```html
<div class="stat-item">
  <h3 class="stat-number">YOUR_NUMBER</h3>
  <p class="stat-label">Your Label</p>
</div>
```

### Customize Colors

Edit CSS variables in `css/styles.css`:

```css
:root {
  --primary-color: #320047; /* Change to your brand color */
  --primary-light: #4d0070;
  /* ... */
}
```

## 📱 Additional Pages

The following pages are included:

- ✅ **Company** (`pages/company.html`) - About JAM!
- ✅ **Contact** (`pages/contact.html`) - Contact form
- ✅ **Privacy** (`pages/privacy.html`) - Privacy policy
- ✅ **Terms** (`pages/terms.html`) - Terms of service

You can add more pages following the same template structure.

## 🎯 SEO Optimization

### Recommended Additions

1. **Favicon**: Add to root and update `<head>`:

   ```html
   <link rel="icon" type="image/png" href="images/favicon.png" />
   ```

2. **Open Graph Tags** for social sharing:

   ```html
   <meta property="og:title" content="JAM! - Job Application Manager" />
   <meta property="og:description" content="Track your job applications..." />
   <meta property="og:image" content="images/og-image.png" />
   ```

3. **Google Analytics**: Add tracking code before `</head>`

4. **Sitemap**: Generate and add `sitemap.xml`

## 🔄 Future Enhancements

Consider adding:

- [ ] Blog section for content marketing
- [ ] Customer testimonials
- [ ] Video demo/tutorial
- [ ] Feature comparison table
- [ ] Integration showcase
- [ ] FAQ section
- [ ] Job search guides/resources
- [ ] Live chat widget
- [ ] Email newsletter signup
- [ ] A/B testing for CTAs

## 📊 Analytics

Track these key metrics:

- Page views and unique visitors
- Conversion rate (signups)
- Bounce rate
- Time on page
- CTA click-through rates
- Mobile vs desktop traffic

## 🐛 Browser Support

Tested and working on:

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📞 Support

For questions about the landing page:

- Check the code comments
- Review the existing documentation
- Test locally before deploying

## 🎉 Launch Checklist

Before going live:

- [ ] Update all placeholder links
- [ ] Add real email addresses
- [ ] Configure contact form backend
- [ ] Add favicon
- [ ] Add Open Graph images
- [ ] Test on mobile devices
- [ ] Test all links
- [ ] Set up analytics
- [ ] Configure HTTPS/SSL
- [ ] Test page load speed
- [ ] Check accessibility (WCAG)
- [ ] Validate HTML/CSS
- [ ] Set up 404 page

---

**Built with ❤️ for JAM! - Helping job seekers succeed**
