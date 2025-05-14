# HVAC Widget Usage Guide

This documentation explains how to embed the lead generation widget on your website.

## Quick Start

Add the following script tag to your website's HTML, typically just before the closing `</body>` tag:

```html
<script src="https://[your-domain]/api/widget-embed?company=your-company-slug&primary=%230066FF&accent=%23F6AD55"></script>
```

Replace the following:
- `[your-domain]` with your actual domain
- `your-company-slug` with your company's slug
- `%230066FF` is URL-encoded hex color code for primary color (#0066FF)
- `%23F6AD55` is URL-encoded hex color code for accent color (#F6AD55)

## Customization Options

The widget accepts the following parameters:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `company` | Your company slug as defined in the system | Required |
| `primary` | Primary color in hex format (URL-encoded) | #0066FF |
| `accent` | Accent color in hex format (URL-encoded) | #F6AD55 |

## Example with Custom Colors

```html
<!-- Blue and Orange Theme -->
<script src="https://[your-domain]/api/widget-embed?company=your-company-slug&primary=%23004DFF&accent=%23FFB347"></script>
```

## Templates and Color Schemes

We have pre-defined templates with their own color schemes:

1. **ModernTrust**: Primary #0066FF, Accent #F6AD55
2. **ComfortClassic**: Primary #004DFF, Accent #FFB347

For best visual consistency, match your widget colors to your template's color scheme.

## Lead Collection

Leads submitted through the widget will appear in your dashboard under the "Leads" section.

## Troubleshooting

If the widget doesn't appear:
1. Check that your company slug is correct
2. Ensure your website allows loading scripts from external domains
3. Check the browser console for any error messages

For additional help, contact support.