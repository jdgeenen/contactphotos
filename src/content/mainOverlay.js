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
 * The Original Code is gContactSync.
 *
 * The Initial Developer of the Original Code is
 * Josh Geenen <joshgeenen+contactphotos@gmail.com>.
 * Portions created by the Initial Developer are Copyright (C) 2010
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

Components.utils.import("resource://app/modules/gloda/utils.js");
 
if (!com) {
  /** A generic wrapper variable */
  var com = {};
}

if (!com.ContactPhotos) {
  /** A wrapper for all CP functions and variables */
  com.ContactPhotos = {};
}

if (!defaultPhotoURI) {
  var defaultPhotoURI = "chrome://messenger/skin/addressbook/icons/contact-generic.png";
}

window.addEventListener("load",
  /**
   * Intializes the string bundle, overrides a few functions, and calls
   * com.ContactPhotos.init when the window has loaded.
   */
  function CP_loadListener(e) {
    try {
      com.ContactPhotos.mIOService = Components.classes["@mozilla.org/network/io-service;1"]
                                              .getService(Components.interfaces.nsIIOService);
      com.ContactPhotos.mConsoleService = Components.classes['@mozilla.org/consoleservice;1']
                                                    .getService(Components.interfaces.nsIConsoleService);
      // setup the string bundle
      com.ContactPhotos.StringBundle = document.getElementById("ContactPhotosStringBundle");
      // override AddExtraAddressProcessing
      try {
        if (AddExtraAddressProcessing) {
          com.ContactPhotos.originalAddExtraAddressProcessing = AddExtraAddressProcessing;
          AddExtraAddressProcessing = com.ContactPhotos.AddExtraAddressProcessing;
        }
      } catch (e) {}
      // Override onClickEmailStar
      // This function is not in Seamonkey
      try {
        if (onClickEmailStar) {
          com.ContactPhotos.originalOnClickEmailStar = onClickEmailStar;
          onClickEmailStar = com.ContactPhotos.onClickEmailStar;
        }
      } catch (e) {}
      // override editContactInlineUI.deleteContact
      // This function is not in Seamonkey
      try {
        if (editContactInlineUI && editContactInlineUI.deleteContact) {
          com.ContactPhotos.originalDeleteContact = editContactInlineUI.deleteContact;
          editContactInlineUI.deleteContact = com.ContactPhotos.deleteContact;
        }
      } catch (e) {}
      // add the photo box
      com.ContactPhotos.init();
    }
    catch (e) { com.ContactPhotos.reportError(e); }
  },
false);

/** The contact for the sender of the selected message */
com.ContactPhotos.mCurrentContact = null;
/** The AB in which the contact for the sender of the selected message is stored */
com.ContactPhotos.mCurrentAb      = null;
/** The emailAddressNode last passed to onClickEmailStar */
com.ContactPhotos.mCurrentNode    = null;
/** The string bundle */
com.ContactPhotos.StringBundle    = null;
/** An nsIIOService */
com.ContactPhotos.mIOService      = null;
/** An nsIConsoleService */
com.ContactPhotos.mConsoleService = null;

/**
 * Initializes this add-on.
 * This method inserts an hbox in between the expandedHeaderView vbox and
 * the expandedHeadersBox vbox in order to add an html:img element to the left
 * of the original header information.  The img contains the photo of the
 * contact who sent the message.  If the sender is not a contact, or if the
 * contact does not have a photo, the generic photo is used.
 */
com.ContactPhotos.init = function ContactPhotos_init(aURI) {
  try {
    let viewBox    = document.getElementById("expandedHeaderView");
    var newHbox    = document.createElement("hbox");
    var imgVbox    = document.createElement("vbox");
    let imgSpacer1 = document.createElement("spacer");
    let imgSpacer2 = document.createElement("spacer");
    let imgBox     = document.createElement("description");
    let img        = document.createElementNS("http://www.w3.org/1999/xhtml",
                                              "html:img");
    var children   = [];
    let maxWidth   = com.ContactPhotos.Preferences.mMaxWidth;
    let maxHeight  = com.ContactPhotos.Preferences.mMaxHeight;
  
    // remove all children from viewBox
    for (let i = 0; i < viewBox.childNodes.length; i++) {
      children.push(viewBox.removeChild(viewBox.childNodes[i]));
    }
    imgSpacer1.setAttribute("flex", "1");
    imgSpacer2.setAttribute("flex", "1");
    // setup the max height and width
    imgBox.style.maxWidth  = img.style.maxWidth  = maxWidth;
    imgBox.style.maxHeight = img.style.maxHeight = maxHeight;
    imgBox.style.textAlign = "center";
    // give the image a border
    img.style.border = com.ContactPhotos.Preferences.mImgBorder;
    // add the tooltip
    imgBox.setAttribute("tooltiptext",
                        com.ContactPhotos.StringBundle.getString("imgTooltip"));
    img.onclick = function (e) {
      // if there isn't a current contact or AB then don't do anything
      if (!com.ContactPhotos.mCurrentContact || !com.ContactPhotos.mCurrentContact) {
        alert(com.ContactPhotos.StringBundle.getString("addBeforeClick"));
        return;
      }
      window.openDialog("chrome://messenger/content/addressbook/abEditCardDialog.xul",
                        "",
                        "chrome,modal,resizable=no,centerscreen",
                        {
                          abURI: com.ContactPhotos.mCurrentAb.URI,
                          card:  com.ContactPhotos.mCurrentContact
                        });
    };
    // give some IDs
    img.setAttribute("id",     "msgHdrFromPhoto");
    imgBox.setAttribute("id",  "msgHdrFromPhotoBox");
    imgVbox.setAttribute("id", "msgHdrFromPhotoOuterBox");
    // set the default src of the image to the default photo URI
    img.setAttribute("src", defaultPhotoURI);
    // add the html:img to the imgBox
    imgBox.appendChild(img);
    // add the img box to the vbox between spacers to center it (somewhat)
    imgVbox.appendChild(imgSpacer1);
    imgVbox.appendChild(imgBox);
    imgVbox.appendChild(imgSpacer2);
    if (com.ContactPhotos.Preferences.mDisplayOnLeft) {
      // add imgBox to the new hbox (first so it is on the left)
      newHbox.appendChild(imgVbox);
    }
    // add the old children of expandedHeaderView (expandedHeadersBox) to the hbox
    while (children.length > 0) {
      newHbox.appendChild(children.shift());
    }
    if (!com.ContactPhotos.Preferences.mDisplayOnLeft) {
      // add imgBox to the new hbox (last so it is on the right)
      newHbox.appendChild(imgVbox);
    }
    // add the new hbox to expandedHeaderView
    viewBox.appendChild(newHbox);
  }
  catch (e) { com.ContactPhotos.reportError(e); }
};

/** The original AddExtraAddressProcessing function */
com.ContactPhotos.originalAddExtraAddressProcessing = null;

/**
 * Meant to override AddExtraAddressProcessing, which is in TB and SM.
 * This function calls com.ContactPhotos.originalAddressExtraAddressProcessing
 * and then updates the src of the photo with the contact's photo, if any, and
 * defaults to the defaultPhotoURI set in abCommon.js
 *
 * In Seamonkey a few extra steps are required.  It doesn't check the ABs for
 * a contact with the e-mail address or use the 'hascard' attribute of the
 * e-mail node.  So, this will do all of that for Seamonkey.
 */
com.ContactPhotos.AddExtraAddressProcessing = function CP_extraAdrProcessing(aEmail, aNode) {
  try {
    // clear the hascard attribute (for Seamonkey)
    if (aNode.hasAttribute("hascard")) {
      aNode.removeAttribute("hascard");
    }
    // call the original
    if (com.ContactPhotos.originalAddExtraAddressProcessing) {
      com.ContactPhotos.originalAddExtraAddressProcessing.apply(this, arguments);
    }
    // if aNode is part of the From box, then use it for the photo
    let id = aNode.parentNode.parentNode.parentNode.id;
    if (id === "expandedfromBox") {
      let photoElem = document.getElementById("msgHdrFromPhoto");
      let photoURI  = defaultPhotoURI;
      // reset mCurrentContact & mCurrentAb
      com.ContactPhotos.mCurrentContact = null;
      com.ContactPhotos.mCurrentAb      = null;

      // Seamonkey doesn't use the hascard attribute and doesn't search the ABs
      // for the contact, so do so manually if necessary
      if (aNode.getAttribute("hascard") === "") {
        var cardDetails = com.ContactPhotos.getCardForEmail(aEmail);
        aNode.cardDetails = cardDetails;
        aNode.setAttribute("hascard", (cardDetails && cardDetails.card ? "true" : "false"));
      }

      // If there is a contact for the sender then get his or her photo
      if (aNode.getAttribute("hascard") === "true") {
        let card  = aNode.cardDetails.card;
        com.ContactPhotos.mCurrentContact = card;
        com.ContactPhotos.mCurrentAb      = aNode.cardDetails.book;
        photoURI  = com.ContactPhotos.getPhotoURI(card.getProperty("PhotoName", null));
      }

      // use a gravatar if we still have the default URI, if the gravatar pref is
      // true, and if the user is online
      // TB 3 has MailOfflineMgr.isOnline() and SM 2 has CheckOnline()...
      // both just get the IO service
      if (photoURI === defaultPhotoURI &&
          com.ContactPhotos.Preferences.mGravatar &&
          com.ContactPhotos.mIOService && !com.ContactPhotos.mIOService.offline) {
        let hash = GlodaUtils.md5HashString(aEmail);
        photoURI = "http://www.gravatar.com/avatar/" + encodeURIComponent(hash) +
                   "?d=" + encodeURIComponent(com.ContactPhotos.Preferences.mGravatarD);
      }
      photoElem.setAttribute("src", photoURI);
    }
  }
  catch (e) { com.ContactPhotos.reportError(e); }
};

/** The original onClickEmailStar method */
com.ContactPhotos.originalOnClickEmailStar = null;

/**
 * Meant to override onClickEmailStar to update the current AB and contact
 * in com.ContactPhotos.
 * This is only in Thunderbird 3 (not Seamonkey)
 */
com.ContactPhotos.onClickEmailStar = function CP_onClickEmailStar(aEvent, aEmailAddressNode) {
  // call the original
  if (com.ContactPhotos.originalOnClickEmailStar) {
    com.ContactPhotos.originalOnClickEmailStar.apply(document, arguments);
  }
  this.mCurrentNode = aEmailAddressNode;
  // update the current AB and contact
  if (aEmailAddressNode && aEmailAddressNode.cardDetails) {
    com.ContactPhotos.mCurrentAb      = aEmailAddressNode.cardDetails.book;
    com.ContactPhotos.mCurrentContact = aEmailAddressNode.cardDetails.card;
  }
  else {
    com.ContactPhotos.mCurrentAb      = null;
    com.ContactPhotos.mCurrentContact = null;
  }
};

/** The original editContactInlineUI.DeleteContact method */
com.ContactPhotos.originalDeleteContact = null;

/**
 * Meant to override editContactInlineUI.DeleteContact to update the current
 * AB and contact variables in com.ContactPhotos.
 * This is only in Thunderbird 3 (not Seamonkey)
 */
com.ContactPhotos.deleteContact = function CP_deleteContact() {
  // call the original
  if (com.ContactPhotos.originalDeleteContact) {
    com.ContactPhotos.originalDeleteContact.apply(editContactInlineUI, arguments);
  }
  // now update the current AB and contact
  // this doesn't always set to null because the original function doesn't
  // always delete the contact (could be read-only and the user can cancel)
  if (this.mCurrentNode && this.mCurrentNode.cardDetails) {
    com.ContactPhotos.mCurrentAb      = com.ContactPhotos.mCurrentNode.cardDetails.book;
    com.ContactPhotos.mCurrentContact = com.ContactPhotos.mCurrentNode.cardDetails.card;
  }
  else {
    com.ContactPhotos.mCurrentAb      = null;
    com.ContactPhotos.mCurrentContact = null;
  }
};

/**
 * Sends the details of an error message to the Error Console and alerts the
 * user.
 */
com.ContactPhotos.reportError = function CP_reportError(aError) {
  let msg = com.ContactPhotos.StringBundle.getString("error") + "\n" + aError +
            "\n\n" + com.ContactPhotos.StringBundle.getString("pleaseReport");
  dump(msg);
  com.ContactPhotos.mConsoleService.logStringMessage(msg);
  alert(msg);
};

/**
 * Returns an object with the first card and AB found with the given e-mail
 * address.
 * This is here for Seamonkey 2, which does not include the original function.
 *
 * @param aEmail {string} The e-mail address to search for.
 *
 * @returns {object} An object with the AB and contact, if found.
 *                   The object has 2 properties: book, containing the AB; and
 *                   card, containing the contact.  Both are null if no contact
 *                   was found with the given e-mail address, or if the e-mail
 *                  address was empty.
 */
com.ContactPhotos.getCardForEmail = function CP_getCardForEmail(aEmail) {
  var result = { book: null, card: null };

  if (!aEmail) {
    return result;
  }

  var abs = Components.classes["@mozilla.org/abmanager;1"]
                        .getService(Components.interfaces.nsIAbManager)
                        .directories;

  while (abs.hasMoreElements()) {
    var ab = abs.getNext().QueryInterface(Components.interfaces.nsIAbDirectory);
    try {
      var card = ab.cardForEmailAddress(aEmail);
      if (card) {
        result.book = ab;
        result.card = card;
        com.ContactPhotos.mCurrentAb      = ab;
        com.ContactPhotos.mCurrentContact = card;
        return result;
      }
    }
    catch (e) { }
  }

  return result;
};

// NOTE: The code below this point is adapted from code in abCommon.js
// Including abCommon.js causes some incompatibilities, notably with
// Addressbooks Synchronizer
/**
 * Returns an nsIFile of the directory in which contact photos are stored.
 * This will create the directory if it does not yet exist.
 */
com.ContactPhotos.getPhotosDir = function CP_getPhotosDir() {
  var file = Components.classes["@mozilla.org/file/directory_service;1"]
                       .getService(Components.interfaces.nsIProperties)
                       .get("ProfD", Components.interfaces.nsIFile);
  // Get the Photos directory
  file.append("Photos");
  if (!file.exists() || !file.isDirectory()) {
    file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0777);
  }
  return file;
};

/**
 * Returns a URI specifying the location of a photo based on its name.
 * If the name is blank, or if the photo with that name is not in the Photos
 * directory then the default photo URI is returned.
 *
 * @param aPhotoName {string} The name of the photo from the Photos folder,
 *                            if any.  Null or blank to use the default URI
 *
 * @return A URI pointing to a photo.
 */
com.ContactPhotos.getPhotoURI = function CP_getPhotoURI(aPhotoName) {
  if (!aPhotoName) {
    return defaultPhotoURI;
  }
  var file = com.ContactPhotos.getPhotosDir();
  try {
    file.append(aPhotoName);
  }
  catch (e) {
    return defaultPhotoURI;
  }
  if (!file.exists()) {
    return defaultPhotoURI;
  }
  return Components.classes["@mozilla.org/network/io-service;1"]
                   .getService(Components.interfaces.nsIIOService)
                   .newFileURI(file).spec;
};
