# Changelog

These are the source changes after the 0.50.1 installers. The Windows, Mac, and Linux files already on the release page do not include this list yet. This update is for the project folder.

## October 27, 2026

### Add and subtract filament

- Each spool shows the grams on hand.
- **+ Add** and **− Subtract** sit next to that number.
- The amount can be grams or kilograms.
- A spool cannot go below zero.
- The shelf **Total** changes as soon as you add or subtract.
- The numbers stay after a refresh.
- Each change keeps the date, time, amount, and a reason.

### Bambu Lab colors and spool cost

- Bambu Lab uses the official color names for each material. There are 318 colors across 46 materials, including Jade White, Bambu Green, and Nardo Gray.
- Other brands keep the shorter color list.
- Every spool has a **Cost per spool**.
- For Bambu Lab, the cost starts at the price Bambu Studio lists for that material. Change it if you paid a different price.
- The shelf **Cost** is the sum of the spool prices.

### Files added

- `components/adjust-dialog.tsx`
- `lib/bambu-catalog.ts`
- `CHANGELOG.md`

## How to update the folder

1. Download `Hardware-Patriots-source.zip`. The file name must end in `.zip`.
2. Unzip it.
3. Open your project and go into the `hardware-patriots` folder.
4. Copy these unzipped files into that folder and replace the old ones. Leave the `.git` folder alone if you see one in the parent folder.
5. Commit the changes and push them.
