const { query } = require('express');
const Listing = require('../models/listing.js');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => { //showing all listings
    const allListing = await Listing.find({});
    res.render("./listing/index.ejs", { allListing });
}

module.exports.renderNewForm = async (req, res) => { //rendering new form
    res.render("./listing/new.ejs");
}

module.exports.showListing = async (req, res) => { //showing a single listing
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({ path: "reviews", populate: { path: "author" } }) //nested populate for reviews and author of reviews  
        .populate("owner"); //populating owner
    if (!listing) { //if listing is not found
        req.flash('error', "Listing you are requested for doesnot exist!!");
        res.redirect(`/listings`);
    }
    // console.log(listing.geometry.coordinates); //for mapbox to show location    
    res.render("./listing/show.ejs", { listing });
}

module.exports.createListing = async (req, res) => { //creating a new listing
    // if (!req.body.listing) {
    //     throw new ExpressError(400, "Send valid data for listing")
    // }
    //req.file will have info about uploded files

    //Geocoding
    let response = await geocodingClient  
        .forwardGeocode({ //forward geocoding
            query: req.body.listing.location, //location from the form
           
            limit: 1 //limiting the result to 1 
        })  
        .send(); //sending the request
        

    let url = req.file.path; //getting the path of the file
    let filename = req.file.filename; //getting the filename
    const newListing = new Listing(req.body.listing);   
    newListing.image = { url, filename };
    //adding owner
    newListing.owner = req.user._id;
    newListing.geometry = response.body.features[0].geometry;
    let savedListing = await newListing.save();
    // console.log(savedListing);
    req.flash('success', "New Listing Created!!")
    res.redirect('/listings');
}

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash('error', "Listing you are requested for doesnot exist!!");
        res.redirect(`/listings`);
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    // console.log(originalImageUrl);
    res.render("./listing/edit.ejs", { listing, originalImageUrl });
}

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;

    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    //for updating files
    if (typeof req.file !== 'undefined') {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }

    req.flash('success', "Listing Updated!!")
    res.redirect(`/listings/${id}`);
}

module.exports.deleteListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    // console.log(deletedListing);
    req.flash('success', "Listing Deleted!!")
    res.redirect(`/listings`);
}