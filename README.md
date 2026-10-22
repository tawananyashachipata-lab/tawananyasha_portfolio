# Tawananyasha's Dev Quest

A custom portfolio website for Tawananyasha Chipata, built as a developer-themed interactive experience.

## Overview

This project presents my software development journey as a game-inspired portfolio with sections for:

- profile and introduction
- skills and learning progress
- tech stack
- real projects and links
- certificates
- contact details

## Local development

```sh
npm install
npm run dev
```

## Notes

- Built with React, TypeScript, and Tailwind CSS
- Designed to feel personal, polished, and professional for recruiters and collaborators
- No generated branding or starter messaging remains in the live experience


## Contact form: Formspree setup

The contact form sends messages inside the portfolio using Formspree's JSON endpoint. No email application or redirect is needed.

1. Sign up at https://formspree.io and create a new form. Set and verify the destination inbox.
2. Copy the form ID from the endpoint (`https://formspree.io/f/FORM_ID`).
3. Copy `.env.example` to `.env.local` and replace `YOUR_FORM_ID` with the actual ID.
4. For Vercel or other hosting, set `VITE_FORMSPREE_FORM_ID` to that same ID in project environment variables, then redeploy.
5. Submit a test message from the deployed website and confirm delivery in Formspree and your inbox.

Until the form ID is configured, visitors see a setup error instead of a false success. The email link remains available as a fallback. The form ID is a public identifier, not a private API key.
