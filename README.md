# Mario és Snake statikus weboldal

Ez a projekt egy egyszerű, publikus statikus weboldal két beépített böngészős játékkal:

- `Mario`: egyszerű platformer jellegű játék
- `Snake`: klasszikus kígyós játék

## Biztonsági megoldások

- Nincs szerveroldali kód vagy adatbázis
- Nincs külső JavaScript vagy CDN
- Beépített Content Security Policy van az oldalon
- Csak helyi (`self`) erőforrások töltődnek be

## GitHub Pages

A projekt már elő van készítve azonnali GitHub Pages publikálásra.

Szükséges fájlok:

- `index.html`
- `styles.css`
- `app.js`
- `.github/workflows/deploy-pages.yml`
- `.nojekyll`

Lépések:

1. Hozz létre egy új GitHub repót.
2. Töltsd fel ebbe a mappába az összes fájlt.
3. A repóban nyisd meg: `Settings` -> `Pages`.
4. A `Source` résznél válaszd a `GitHub Actions` lehetőséget.
5. Push után a workflow automatikusan publikálja az oldalt.

Ez a workflow működik `main` és `master` branch esetén is.

## Más statikus hoszting

Feltölthető még például:

- GitHub Pages
- Netlify
- Cloudflare Pages
- Vercel statikus projektként
