if (!com) {
  /** A generic wrapper variable */
  var com = {};
}

if (!com.ContactPhotos) {
  /** A wrapper for all CP functions and variables */
  com.ContactPhotos = {};
}

window.addEventListener("load",
  /**
   * Registers the pref observer.
   */
  function CP_PreferencesLoadListener(e) {
    com.ContactPhotos.Preferences.register();
  },
false);

window.addEventListener("unload",
  /**
   * Unregisters the pref observer.
   */
  function CP_PreferencesLoadListener(e) {
    com.ContactPhotos.Preferences.unregister();
  },
false);

/**
 * Stores preferences for this add-on and registers a pref observer to ensure
 * that the preferences are always up-to-date.
 * When a preference changes, this class immediately updates the corresponding
 * element(s).
 * @class
 */
com.ContactPhotos.Preferences = {
  /** The max width for the image */
  mMaxWidth:     "10ch",
  /** The max height for the image */
  mMaxHeight:    "10ch",
  /** Display the photo on the left */
  mDisplayOnLeft: true,
  mGravatar:      true,
  mGravatarD:     "identicon",
  mImgBorder:     "1px solid black",
  /** The pref branch for this add-on */
  mPrefBranch: Components.classes["@mozilla.org/preferences-service;1"]
                        .getService(Components.interfaces.nsIPrefService)
                        .getBranch("extensions.contactphotos.")
                        .QueryInterface(Components.interfaces.nsIPrefBranch2),
  /** Stores whether the pref observer has been registered */
  mRegistered: false,
  /**
   * Registers the pref observer and gets the initial preference values.
   */
  register: function CP_Preferences_register() {
    // Get the preferences
    this.mMaxHeight     = this.mPrefBranch.getCharPref("maxHeight");
    this.mMaxWidth      = this.mPrefBranch.getCharPref("maxWidth");
    this.mDisplayOnLeft = this.mPrefBranch.getBoolPref("displayOnLeft");
    this.mGravatar      = this.mPrefBranch.getBoolPref("gravatar");
    this.mGravatarD     = this.mPrefBranch.getCharPref("gravatarD");
    this.mImgBorder     = this.mPrefBranch.getCharPref("imgBorder");
    // Add an observer
    this.mPrefBranch.addObserver("", this, false);
    this.mRegistered = true;
  },
  /**
   * Unregisters the pref observer.
   */
  unregister: function CP_Preferences_unregister() {
    if(!this.mPrefBranch || !this.mRegistered) {
      return;
    }
    this.mPrefBranch.removeObserver("", this);
    this.mRegistered = false;
  },
  /**
   * Called when a preference changes on the extensions.contactphotos branch.
   * Updates the max height and width of the image, if possible.
   *
   * @param aSubject {nsIPrefBranch} The branch.
   * @param aTopic {string} A description of what happened.
   * @param aData  {string} The name of the pref that was changed.
   */
  observe: function(aSubject, aTopic, aData) {
    if (aTopic != "nsPref:changed") {
      return;
    }
    let img    = document.getElementById("msgHdrFromPhoto");
    let imgBox = document.getElementById("msgHdrFromPhotoBox");
    // if the maxWidth or maxHeight changes, update the member variable and
    // immediately update the image.
    switch (aData) {
      case "maxWidth":
        this.mMaxWidth   = this.mPrefBranch.getCharPref("maxWidth");
        if (img && imgBox) {
          img.style.maxWidth = imgBox.style.maxWidth = this.mMaxWidth;
        }
        break;
      case "maxHeight":
        this.mMaxHeight   = this.mPrefBranch.getCharPref("maxHeight");
        if (img && imgBox) {
          img.style.maxHeight = imgBox.style.maxHeight = this.mMaxHeight;
        }
        break;
      case "displayOnLeft":
        try {
          this.mDisplayOnLeft = this.mPrefBranch.getBoolPref("displayOnLeft");
          var photoBox        = document.getElementById("msgHdrFromPhotoOuterBox");
          var parent          = photoBox.parentNode;
          // remove the photo box
          parent.removeChild(photoBox);
          // now add it first or last based on the pref value
          if (this.mDisplayOnLeft) {
            parent.insertBefore(photoBox, parent.firstChild);
          }
          else {
            parent.appendChild(photoBox);
          }
        } catch (e) { alert(e); }
        break;
      case "gravatar":
        this.mGravatar = this.mPrefBranch.getBoolPref("gravatar");
        break;
      case "gravatarD":
        this.mGravatarD = this.mPrefBranch.getCharPref("gravatarD");
        break;
      case "imgBorder":
        this.mImgBorder = this.mPrefBranch.getCharPref("imgBorder");
        img.style.border = this.mImgBorder;
        break;
    }
  }
};
