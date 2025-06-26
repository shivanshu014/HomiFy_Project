const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync.js');
const { isLoggedIn, validateListing, isOwner } = require('../middleware.js');
const listingController = require('../controllers/listings.js');
const multer = require('multer')
const { storage } = require('../cloudConfig.js')
const upload = multer({ storage })
const Listing = require('../models/listing.js');

router.get('/search', wrapAsync(async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.redirect('/listings'); // Redirect if no query is provided
    }

    // Search by title or location using a case-insensitive regex
    const listings = await Listing.find({
        $or: [
            { title: { $regex: query, $options: 'i' } },
            { location: { $regex: query, $options: 'i' } },
            { country: { $regex: query, $options: 'i' } },
            // { owner: { $regex: query, $options: 'i' } },
        ]
    });

    res.render('./listing/index.ejs', { allListing: listings, query });
}));


router.
    route("/")
    .get(wrapAsync(listingController.index))  //Index route
    .post(
        isLoggedIn,
        upload.single("listing[image]"),
        validateListing,
        wrapAsync(listingController.createListing));  //create route



//new route:Create operation, it is kept above id because id will new as id
router.get('/new', isLoggedIn, wrapAsync(listingController.renderNewForm));

router.route("/:id")

    .get(wrapAsync(listingController.showListing)) //Show route
    .put(
        isLoggedIn,
        upload.single("listing[image]"),
        validateListing,
        isOwner,
        wrapAsync(listingController.updateListing)) //update route
    .delete(
        isLoggedIn,
        isOwner,
        wrapAsync(listingController.deleteListing)); //delete rout


//Edit route
router.get('/:id/edit',
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.renderEditForm));

module.exports = router;