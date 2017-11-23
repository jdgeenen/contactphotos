/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Contact Photos.
 *
 * The Initial Developer of the Original Code is
 * Josh Geenen <joshgeenen+contactphotos@gmail.com>.
 * Portions created by the Initial Developer are Copyright (C) 2010-2016
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

/** Containing object for ContactPhotos */
var ContactPhotos = ContactPhotos || {};

window.addEventListener("load",
  /**
   * Registers the pref observer.
   */
  function CP_PreferencesLoadListener(e) {
    window.removeEventListener("load", CP_PreferencesLoadListener, false);
    ContactPhotos.Preferences.register();
  },
false);

window.addEventListener("unload",
  /**
   * Unregisters the pref observer.
   */
  function CP_PreferencesLoadListener(e) {
    ContactPhotos.Preferences.unregister();
  },
false);

/**
 * Stores preferences for this add-on and registers a pref observer to ensure
 * that the preferences are always up-to-date.
 * When a preference changes, this class immediately updates the corresponding
 * element(s).
 * @class
 */
ContactPhotos.Preferences = {
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
                        .getBranch("extensions.contactphotos."),
  /** Stores whether the pref observer has been registered */
  mRegistered: false,
  /**
   * Registers the pref observer and gets the initial preference values.
   */
  register: function CP_Preferences_register() {
    // Get the preferences
    this.mMaxHeight       = this.mPrefBranch.getCharPref("maxHeight");
    this.mMaxWidth        = this.mPrefBranch.getCharPref("maxWidth");
    this.mDisplayOnLeft   = this.mPrefBranch.getBoolPref("displayOnLeft");
    this.mDisplayOnTop    = this.mPrefBranch.getBoolPref("displayOnTop");
    this.mGravatar        = this.mPrefBranch.getBoolPref("gravatar");
    this.mGravatarD       = this.mPrefBranch.getCharPref("gravatarD");
    this.mImgBorder       = this.mPrefBranch.getCharPref("imgBorder");
    this.mImgBorderRadius = this.mPrefBranch.getCharPref("imgBorderRadius");

    // nsIPrefBranch2 was merged into nsIPrefBranch in Gecko 13 (TB 13/SM 2.10)
    // TB 57 removed support for it.
    if (!("addObserver" in this.mPrefBranch)) {
      this.mPrefBranch.QueryInterface(Components.interfaces.nsIPrefBranch2);
    }

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
      case "displayOnTop":
        try {
          this.mDisplayOnTop = this.mPrefBranch.getBoolPref("displayOnTop");
          var photoBox        = document.getElementById("msgHdrFromPhotoBox");
          var topSpacer       = photoBox.previousSibling;
          topSpacer.collapsed = this.mDisplayOnTop ? true : false;
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
        if (img) {
          img.style.border = this.mImgBorder;
        }
        break;
      case "imgBorderRadius":
        this.mImgBorderRadius = this.mPrefBranch.getCharPref("imgBorderRadius");
        if (img) {
          img.style.MozBorderRadius = 
            img.style.borderRadius  =
              this.mImgBorderRadius;
        }
        break;
    }
  }
};
