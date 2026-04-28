# Sample Products Setup Guide

## Overview
The app now includes functionality to seed your Firebase database with 12 sample products for testing and demonstration purposes.

## How to Add Sample Products

### Option 1: Using the Profile Screen (Recommended)
1. Open the app and navigate to the **Profile** tab
2. On the **Profile** section, scroll down
3. Tap the blue **"Seed Sample Products"** button
4. Confirm the action when prompted
5. Wait for the operation to complete (you'll see a success message)
6. The sample products will now appear on the home feed!

### Option 2: Using the Node.js Script
If you prefer to seed the database from the command line:

1. First, you need to set up Firebase Admin SDK credentials:
   - Download your service account key from Firebase Console
   - Save it as `swapliy/serviceAccountKey.json`

2. Run the seeding script:
```bash
cd swapliy
node scripts/addSampleProducts.js
```

## Sample Products Included

The seeding process will add 12 diverse products across different categories:

1. **Vintage Denim Jacket** (Clothing) - 45,000 ₮
2. **Wireless Headphones** (Electronics) - 120,000 ₮
3. **Yoga Mat & Accessories** (Sports) - 35,000 ₮
4. **Vintage Book Collection** (Books) - 25,000 ₮
5. **Coffee Maker** (Home) - 55,000 ₮
6. **Gaming Controller** (Electronics) - 65,000 ₮
7. **Running Shoes** (Sports) - 80,000 ₮
8. **Desk Lamp** (Home) - 30,000 ₮
9. **Action Figures Set** (Toys) - 40,000 ₮
10. **Vintage Camera** (Electronics) - 150,000 ₮
11. **Leather Backpack** (Clothing) - 75,000 ₮
12. **Bicycle** (Sports) - 250,000 ₮

## After Seeding

Once the sample products are added:

### On the Home Feed
- All 12 products will appear as public listings
- You can like/unlike any product
- Products show seller information and like counts
- Pull down to refresh the feed

### On Your Profile
- **My Products tab**: Shows all products you've created
- **Liked tab**: Shows products you've liked
- You can unlike products from the Liked tab

## Important Notes

⚠️ **For Testing Only**
- Sample products are created under your user account
- You can delete them manually from Firestore if needed
- Each seed operation adds products, so avoid running it multiple times unless you want duplicates

✅ **Requirements**
- You must be logged in to seed products
- Firebase must be properly configured
- You need a stable internet connection

## Testing Recommendations

1. **First Run**: Create your own product through the Add tab
2. **Then Seed**: Add sample products using the Profile button
3. **Test Features**:
   - Like/unlike products on the feed
   - Switch between tabs on the home feed
   - Check the Profile -> Liked section
   - Pull-to-refresh on any tab

## Troubleshooting

**"Failed to add sample products" error**
- Ensure you're logged in
- Check Firebase configuration in `config/firebase.ts`
- Check internet connection

**Products not appearing on home feed**
- Pull-to-refresh the home screen
- Ensure `isPublic: true` is set in the database
- Check that products have `active: true` status

**Duplicate products**
- This happens if you seed multiple times
- You can delete them from Firestore Console manually

## Managing Sample Products

### View in Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select the "swapliy" project
3. Navigate to Firestore Database
4. View the "products" collection

### Delete Sample Products
You can manually delete sample products:
1. Open Firebase Console
2. Find products by `sellerEmail` containing "seller"
3. Delete unwanted documents

Or you can filter and delete via the app by unliking and removing from your profile.
