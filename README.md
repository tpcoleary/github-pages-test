# GitHub Pages Test

Minimal static site used to verify GitHub repository creation, push, GitHub Pages publishing, and a lightweight Google sign-in gate.

## What It Does

- Renders a Google sign-in button using Google Identity Services
- Lets you store a Google web app client ID in browser local storage
- Lets you maintain a simple local allowlist of approved Gmail addresses
- Shows allow or deny after sign-in based on the signed-in email

## What You Need

1. A Google OAuth web application client ID
2. Your GitHub Pages URL added to the authorized JavaScript origins in Google Cloud

## Important Note

This is a client-side gate for static hosting. It is useful for testing and light friction, but it is not strong security.
