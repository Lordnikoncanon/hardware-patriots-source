# Changelog

## 1.0.0 — October 27, 2026

The 0.50.1 installers do not include this version. Push this folder, then run **Release installers**. The new programs are named 1.0.0.

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

## How to start over

The steps are in `START-HERE.txt`. These files are the whole project. Put them in the `hardware-patriots-source` repository. Open `START-HERE.txt` after you unzip the download.

## How to update the executables

The executables are built on GitHub after the folder is pushed.

1. Open the repository on GitHub.
2. Click **Actions**.
3. Click **Release installers** on the left.
4. Click **Run workflow**. Leave the branch on `main`. Click the green **Run workflow** button.
5. Wait until Windows, Mac, Linux, and Publish are green.
6. Open **Releases**. Download the files named **1.0.0**.

The Windows file ends in `.exe`. Open it. Do not unzip it. The Mac files end in `.zip`.

Do not click **Re-run jobs** on an old red run. That builds the old code again.
