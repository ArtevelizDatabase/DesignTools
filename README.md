# DesignTools - Professional Design & Productivity Suite

A comprehensive collection of web-based design and productivity tools built with modern technologies.

## 🚀 Live Demo

Visit: [Your Domain Here](https://yourdomain.com)

## 🛠️ Tools Included

### 📊 CSV Compare
- Advanced CSV data analysis and comparison
- Interactive charts and visualizations
- Export functionality
- Responsive design

### 🔑 Keyword Bank
- Cloud-based keyword management with Supabase integration
- Search, categorize, and organize keywords
- Import/Export capabilities
- Real-time synchronization

### 🖼️ Image Resizer
- Batch image processing
- Multiple format support
- Quality optimization
- Download processed images

### 📝 Text to HTML Converter
- Convert plain text to formatted HTML
- Custom styling options
- Real-time preview
- Copy to clipboard functionality

### 💰 Salary Calculator
- Net salary calculation
- Tax deduction analysis
- Financial planning tools
- Detailed breakdown reports

## 🌟 Features

- **Responsive Design**: Works on all devices and screen sizes
- **Dark Mode Support**: Toggle between light and dark themes
- **Modern UI**: Glass morphism effects and smooth animations
- **Cloud Storage**: Keyword Bank with Supabase database integration
- **Fast Performance**: Optimized for speed and efficiency
- **Accessibility**: Built with accessibility best practices
- **PWA Support**: Install as a native app on mobile and desktop
- **Offline Functionality**: Many tools work without internet connection
- **Service Worker**: Automatic caching and background sync
- **Push Notifications**: Stay updated with new features

## 📱 Progressive Web App (PWA)

### Installation
**Desktop (Chrome, Edge, Firefox):**
1. Visit the website
2. Look for the install icon in the address bar
3. Click "Install DesignTools"
4. The app will be added to your desktop

**Mobile (Android/iOS):**
1. Open the website in your browser
2. Tap the "Install App" button when it appears
3. Or use the browser menu → "Add to Home Screen"
4. Launch like any native app

### PWA Features
- **Offline Access**: Core tools work without internet
- **Fast Loading**: Cached resources load instantly
- **Native Feel**: Fullscreen experience like native apps
- **Automatic Updates**: Always get the latest version
- **Background Sync**: Data syncs when connection returns
- **Push Notifications**: Optional update notifications

### Offline Capabilities
- ✅ **Image Resizer**: Full functionality offline
- ✅ **Text to HTML**: Complete offline support
- ✅ **Salary Calculator**: Works without internet
- ✅ **Keyword Bank**: Uses localStorage when offline
- ⚠️ **CSV Compare**: Basic functionality (no chart library offline)
- ❌ **Supabase Features**: Requires internet connection

## 🏗️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS, Custom CSS
- **Database**: Supabase (PostgreSQL)
- **Charts**: Chart.js
- **Icons**: Material Symbols
- **Fonts**: Plus Jakarta Sans

## 📁 Project Structure

```
DesignTools/
├── index.html              # Main landing page
├── csv-compare.html         # CSV comparison tool
├── keyword-bank.html        # Keyword management tool
├── resize-image.html        # Image resizing tool
├── DescriptionGRConverter.html # Text to HTML converter
├── CalculatorGaji.html      # Salary calculator
├── css/
│   ├── common.css          # Shared styles
│   ├── keyword-bank.css    # Keyword Bank specific styles
│   ├── resize-image.css    # Image Resizer specific styles
│   └── analytics.css       # CSV Compare specific styles
├── js/
│   ├── common.js           # Shared JavaScript functionality
│   ├── keyword-bank.js     # Keyword Bank logic
│   ├── csv-compare.js      # CSV Compare logic
│   ├── resize-image.js     # Image Resizer logic
│   ├── supabase-service.js # Database service layer
│   ├── config.js           # Configuration file
│   └── worker.js           # Web Worker for performance
└── docs/
    ├── SUPABASE_SETUP_GUIDE.md
    └── SUPABASE_INTEGRATION_DOCS.md
```

## 🚀 Deployment

### GitHub Pages Deployment

1. Push code to GitHub repository
2. Go to repository Settings > Pages
3. Select source branch (main/master)
4. Site will be available at `https://username.github.io/repository-name`

### Custom Domain with Cloudflare

1. Add your domain to Cloudflare
2. Configure DNS settings:
   - Add CNAME record pointing to `username.github.io`
   - Or add A records pointing to GitHub Pages IPs
3. Enable Cloudflare proxy for additional features
4. Configure HTTPS settings in Cloudflare

### Environment Setup

1. **Supabase Configuration** (for Keyword Bank):
   ```javascript
   // Update js/config.js with your Supabase credentials
   const SUPABASE_CONFIG = {
     url: 'https://your-project-id.supabase.co',
     anonKey: 'your-anon-key-here'
   };
   ```

2. **GitHub Repository Setup**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/username/designtools.git
   git push -u origin main
   ```

## 🔧 Configuration

### Supabase Setup (Optional - for Keyword Bank)

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Run SQL schema from `docs/SUPABASE_SETUP_GUIDE.md`
4. Update `js/config.js` with your credentials
5. The app will automatically fallback to localStorage if Supabase is not configured

### Cloudflare Settings

Recommended Cloudflare settings for optimal performance:

- **SSL/TLS**: Full (strict)
- **Always Use HTTPS**: On
- **Auto Minify**: CSS, JavaScript, HTML
- **Brotli Compression**: On
- **Browser Cache TTL**: 4 hours
- **Caching Level**: Standard

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📱 Mobile Compatibility

- iOS Safari 14+
- Chrome Mobile 90+
- Samsung Internet 13+

## 🔒 Security Features

- CSP (Content Security Policy) headers recommended
- HTTPS only (enforced via Cloudflare)
- Input validation and sanitization
- XSS protection
- Secure Supabase integration with RLS policies

## 🎨 Customization

### Themes
- Modify CSS custom properties in `css/common.css`
- Dark/light mode toggle available
- Responsive breakpoints configurable

### Adding New Tools
1. Create new HTML file
2. Add navigation link in all pages
3. Include common CSS and JS files
4. Follow existing tool structure

## 📈 Performance

- Lighthouse Score: 95+ (Performance)
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1

## 🐛 Known Issues

- None currently reported

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 📞 Support

For issues and questions:
- Create GitHub issue
- Contact: [your-email@domain.com]

## 🔄 Updates

- Version 1.0.0: Initial release with all tools
- Version 1.1.0: Supabase integration for Keyword Bank
- Version 1.2.0: Modern UI redesign

---

**Made with ❤️ by [Your Name]**