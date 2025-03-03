# Onfido SDK UI Layer

[![Build Status](https://travis-ci.org/onfido/onfido-sdk-ui.svg?branch=master)](https://travis-ci.org/onfido/onfido-sdk-ui)

## Table of contents

* [Overview](#overview)
* [Getting started](#getting-started)
* [Handling callbacks](#handling-callbacks)
* [Removing SDK](#removing-sdk)
* [Customising SDK](#customising-sdk)
* [Creating checks](#creating-checks)
* [Going live](#going-live)
* [More information](#more-information)

## Overview

This SDK provides a set of components for JavaScript applications to allow capturing of identity documents and face photos/videos for the purpose of identity verification. The SDK offers a number of benefits to help you create the best onboarding / identity verification experience for your customers:

- Carefully designed UI to guide your customers through the entire photo/video-capturing process
- Modular design to help you seamlessly integrate the photo/video-capturing process into your application flow
- Advanced image quality detection technology to ensure the quality of the captured images meets the requirement of the Onfido identity verification process, guaranteeing the best success rate
- Direct image upload to the Onfido service, to simplify integration*

Note: the SDK is only responsible for capturing photos/videos. You still need to access the [Onfido API](https://documentation.onfido.com/) to manage applicants and checks.

Users will be prompted to upload a file containing an image of their document. On handheld devices they can also use the native camera to take a photo of their document.

Face step allows users to use their device cameras to capture their face using photos or videos.

![Various views from the SDK](demo/screenshots.jpg)

## Getting started

### 1. Obtaining an API token

In order to start integration, you will need the **API token**. You can use our [sandbox](https://documentation.onfido.com/#sandbox-testing) environment to test your integration, and you will find the sandbox token inside your [Onfido Dashboard](https://onfido.com/dashboard/api/tokens).

### 2. Creating an applicant

With your API token, you should create an applicant by making a request to the [create applicant endpoint](https://documentation.onfido.com/#create-applicant) from your server:

```shell
$ curl https://api.onfido.com/v2/applicants \
  -H 'Authorization: Token token=YOUR_API_TOKEN' \
  -d 'first_name=John' \
  -d 'last_name=Smith'
```

You will receive a response containing the applicant id which will be used to create a JSON Web Token.

### 3. Generating an SDK token

For security reasons, instead of using the API token directly in you client-side code, you will need to generate and include a short-lived JSON Web Token ([JWT](https://jwt.io/)) every time you initialise the SDK. To generate an SDK Token you should perform a request to the [SDK Token endpoint](https://documentation.onfido.com/#generate-web-sdk-token) in the Onfido API:

```shell
$ curl https://api.onfido.com/v2/sdk_token \
  -H 'Authorization: Token token=YOUR_API_TOKEN' \
  -F 'applicant_id=YOUR_APPLICANT_ID' \
  -F 'referrer=REFERRER_PATTERN'
```

Make a note of the `token` value in the response, as you will need it later on when initialising the SDK.

\* Tokens expire 90 minutes after creation.

### 4. Including/Importing the library

#### 4.1 HTML Script Tag Include

Include it as a regular script tag on your page:

```html
<script src='dist/onfido.min.js'></script>
```

And the CSS styles:

```html
<link rel='stylesheet' href='dist/style.css'>
```

#### Example app

[JsFiddle example here.](https://jsfiddle.net/ckLh05y4/)
Simple example using script tags.

#### 4.2 NPM style import

You can also import it as a module into your own JS build system (tested with Webpack).


```sh
$ npm install --save onfido-sdk-ui
```

```js
// ES6 module import
import {init} from 'onfido-sdk-ui'

// commonjs style require
var Onfido = require('onfido-sdk-ui')
```

The **CSS style** will be included **inline with the JS code** when the library is imported.

#### Notice

The library is **Browser only**, it does not support the **Node Context**.

#### Example App

 **[Webpack Sample App repository here](https://github.com/onfido/onfido-sdk-web-sample-app/).**
Example app which uses the npm style of import.

### 5. Adding basic HTML markup

There is only one element required in your HTML, an empty element for the modal interface to mount itself on:

```html
<!-- At the bottom of your page, you need an empty element where the
verification component will be mounted. -->
<div id='onfido-mount'></div>
```

### 6. Initialising the SDK

You are now ready to initialise the SDK:

```js
Onfido.init({
  // the JWT token that you generated earlier on
  token: 'YOUR_JWT_TOKEN',
  // id of the element you want to mount the component on
  containerId: 'onfido-mount',
  onComplete: function(data) {
    console.log("everything is complete")
    // `data` will be an object that looks something like this:
    // ```
    // {
    //   "document_front": {
    //     "id": "5c7b8461-0e31-4161-9b21-34b1d35dde61",
    //     "type": "passport",
    //     "side": "front"
    //   },
    //   "face": {
    //     "id": "0af77131-fd71-4221-a7c1-781f22aacd01",
    //     "variant": "standard"
    //   }
    // }
    // ```
    //
    // You can now trigger your backend to start a new check
    // `data.face.variant` will return the variant used for the face step
    // this can be used to perform a facial similarity check on the applicant
  }
})
```

Congratulations! You have successfully started the flow. Carry on reading the next sections to learn how to:

- Handle callbacks
- Remove the SDK from the page
- Customise the SDK
- Create checks

## Handling callbacks

- **`onComplete {Function} optional`**

  Callback that fires when both the document and face have successfully been captured and uploaded.
  At this point you can trigger your backend to create a check by making a request to the Onfido API [create check endpoint](https://documentation.onfido.com/#create-check).
  The callback returns an object with the `variant` used for the face capture. The variant can be used to initiate the `facial_similarity` check. The data will be formatted as follow:  `{face: {variant: 'standard' | 'video'}}`.

  Here is an `onComplete` callback example:

  ```js
  Onfido.init({
    token: 'your-jwt-token',
    containerId: 'onfido-mount',
    onComplete: function(data) {
      console.log("everything is complete")
      // tell your backend service that it can create the check
      // when creating a `facial_similarity` check, you can specify the variant
      // by passing the value within `data.face.variant`
    }
  })

  ```
  Based on the applicant id, you can then create a check for the user via your backend.


- **`onModalRequestClose {Function} optional`**

  Callback that fires when the user attempts to close the modal.
  It is your responsibility to decide then to close the modal or not
   by changing the property `isModalOpen`.


## Removing SDK

If you are embedding the SDK inside a single page app, you can call the `tearDown` function to remove the SDK completely from the current webpage. It will reset state and you can safely re-initialise the SDK inside the same webpage later on.

```javascript
onfidoOut = Onfido.init({...})
...
onfidoOut.tearDown()
```

## Customising SDK

A number of options are available to allow you to customise the SDK:

- **`token {String} required`**

  A JWT is required in order to authorise with our WebSocket endpoint. If one isn’t present, an exception will be thrown.

- **`useModal {Boolean} optional`**

  Turns the SDK into a modal, which fades the background and puts the SDK into a contained box.

  Example:
  ```javascript
  <script>
      var onfido = {}

      function triggerOnfido() {
        onfido = Onfido.init({
          useModal: true,
          isModalOpen: true,
          onModalRequestClose: function() {
            // Update options with the state of the modal
            onfido.setOptions({isModalOpen: false})
          },
          token: 'token',
          onComplete: function(data) {
            // callback for when everything is complete
            console.log("everything is complete")
          }
        });
      };
  </script>

  <body>
    <!-- Use a button to trigger the Onfido SDK  -->
    <button onClick="triggerOnfido()">Verify identity</button>
    <div id='onfido-mount'></div>
  </body>
  ```

- **`isModalOpen {Boolean} optional`**

  In case `useModal` is set to `true`, this defines whether the modal is open or closed.
  To change the state of the modal after calling `init()` you need to later use `setOptions()` to modify it.
  The default value is `false`.

- **`containerId {String} optional`**

  A string of the ID of the container element that the UI will mount to. This needs to be an empty element. The default ID is `onfido-mount`.

- **`language {String || Object} optional`**
  The SDK language can be customised by passing a String or an Object. At the moment, we support and maintain translations for English (default) and Spanish, using respectively the following locale tags: `en`, `es`.
  To leverage one of these two languages, the `language` option should be passed as a string containing a supported language tag.

  Example:
  ```javascript
  language: 'es'
  ```

  The SDK can also be displayed in a custom language by passing an object containing the locale tag and the custom phrases.
  The object should include the following keys:
    - `locale`: A locale tag. This is **required** when providing phrases for an unsupported language.
      You can also use this to partially customise the strings of a supported language (e.g. Spanish), by passing a supported language locale tag (e.g. `es`). For missing keys, a warning and an array containing the missing keys will be returned on the console. The values for the missing keys will be displayed in the language specified within the locale tag if supported, otherwise they will be displayed in English.
      The locale tag is also used to override the language of the SMS body for the cross device feature. This feature is owned by Onfido and is currently only supporting English and Spanish.

    - `phrases` (required) : An object containing the keys you want to override and the new values. The keys can be found in [`/src/locales/en.json`](/src/locales/en.json). They can be passed as a nested object or as a string using the dot notation for nested values. See the examples below.
    - `mobilePhrases` (optional) : An object containing the keys you want to override and the new values. The values specified within this object are only visible on mobile devices. Please refer to [`src/locales/mobilePhrases/en.json`](src/locales/mobilePhrases/en.json).

    ```javascript
    language: {
      locale: 'fr',
      phrases: {welcome: {title: 'Ouvrez votre nouveau compte bancaire'}},
      mobilePhrases: {
        'capture.driving_licence.instructions': 'This string will only appear on mobile'
      }
    }
    ```

  If `language` is not present the default copy will be in English.

- **`smsNumberCountryCode {String} optional`**
  The default country for the SMS number input can be customised by passing the `smsNumberCountryCode` option when the SDK is initialised. The value should be a 2-characters long ISO Country code string. If empty, the SMS number country code will default to `GB`.

  Example:
  ```javascript
  smsNumberCountryCode: 'US'
  ```

- **`userDetails {Object} optional`**
  Some user details can be specified ahead of time, so that the user doesn't need to fill them in themselves.

  The following details can be used by the SDK:
    - `smsNumber` (optional) : The user's mobile number, which can be used for sending any SMS messages to the user. An example SMS message sent by the SDK is when a user requests to use their mobile devices to take photos. This should be formatted as a string, with a country code (e.g. `"+447500123456"`)

    ```javascript
    userDetails: { smsNumber: '+447500123456' }
    ```

- **`steps {List} optional`**

  List of the different steps and their custom options. Each step can either be specified as a string (when no customisation is required) or an object (when customisation is required):

  ```javascript
  steps: [
    {
      type: 'welcome',
      options: {
        title: 'Open your new bank account'
      }
    },
    'document',
    'face'
  ]
  ```

  In the example above, the SDK flow is consisted of three steps: `welcome`, `document` and `face`. Note that the `title` option of the `welcome` step is being overridden, while the other steps are not being customised.

  The SDK can also be used to capture Proof of Address documents. This can be achieved by using the `poa` step.

  Below are descriptions of the steps and the custom options that you can specify inside the `options` property. Unless overridden, the default option values will be used:

  ### welcome ###

  This is the introduction screen of the SDK. Use this to explain to your users that they need to supply identity documents (and face photos/videos) to have their identities verified. The custom options are:

  - title (string)
  - descriptions ([string])
  - nextButton (string)

  ### document ###

  This is the document capture step. Users will be asked to select the document type and to provide images of their selected documents. They will also have a chance to check the quality of the images before confirming.

  The custom options are:
  - documentTypes (object)

  The list of document types visible to the user can be filtered by using the `documentTypes` option. The default value for each document type is `true`. If `documentTypes` only includes one document type, users will not see the document selection screen, instead they will be taken to the capture screen straight away.

  ```
  options: {
    documentTypes: {
      passport: boolean,
      driving_licence: boolean,
      national_identity_card: boolean
    }
  }
  ```
  - forceCrossDevice (boolean - default: `false`)
  When set to `true`, desktop users will be forced to use their mobile devices to capture the document image. They will be able to do so via the built-in SMS feature. Use this option if you want to prevent file upload from desktops.

  ```
  options: {
    forceCrossDevice: true
  }
  ```

  ### poa ###

  This is the Proof of Address capture step. Users will be asked to select the document type and to provide images of their selected document. They will also have a chance to check the quality of the images before confirming.
  The custom options are:
  - country (default: `GBR`)
  - documentTypes
  ```
  options: {
    country: string,
    documentTypes: {
      bank_building_society_statement: boolean,
      utility_bill: boolean,
      council_tax: boolean, // GBR only
      benefit_letters: boolean, // GBR only
      government_letter: boolean // non-GBR only
    }
  }
  ```
  Proof of Address capture is currently a BETA feature, and it cannot be used in conjunction with the document and face steps as part of a single SDK flow.

  ### face ###

  This is the face capture step. Users will be asked to capture their face in the form of a photo or a video. They will also have a chance to check the quality of the photos or video before confirming.

  The custom options are:
  - requestedVariant (string)
   A preferred variant can be requested for this step, by passing the option `requestedVariant: 'standard' | 'video'`. If empty, it will default to `standard` and a photo will be captured. If the `requestedVariant` is `video`, we will try to fulfil this request depending on camera availability and device/browser support. In case a video cannot be taken the face step will fallback to the `standard` option. At the end of the flow, the `onComplete` callback will return the `variant` used to capture face and this can be used to initiate the facial_similarity check.

  - uploadFallback (boolean - default: `true`)
  By default, the SDK will try to take a live photo/video of the user. When this is not possible - because of lack of browser support or on mobile devices with no camera - the user will be presented with an upload fallback, where they will be able to select a selfie from their phone gallery.
  The upload fallback for the the face step can be disabled by passing the option `uploadFallback: false`.

  Warning: if the user is on a desktop with no camera or the camera is not functional, they will be forced to continue the flow on their mobile device via the built-in SMS feature. If the mobile does not have a camera or there is no camera browser support, _and_ the `uploadFallback` is set to `false`, the user **won't be able to complete the flow**.

  ```
  options: {
    requestedVariant: 'standard' | 'video',
    uploadFallback: false
  }
  ```

  ### complete ###

  This is the final completion step. You can use this to inform your users what is happening next. The custom options are:

  - message (string)
  - submessage (string)

### Changing options in runtime

It's possible to change the options initialised at runtime:

```javascript
onfidoOut = Onfido.init({...})
...
//Change the title of the welcome screen
onfidoOut.setOptions({
  steps: [
    {
      type:'welcome',
      options:{title:"New title!"}
    },
    'document',
    'face',
    'complete'
  ]
});
...
//replace the jwt token
onfidoOut.setOptions({ token:"new token" });
...
//Open the modal
onfidoOut.setOptions({ isModalOpen:true });
```

The new options will be shallowly merged with the previous one. So one can pass only the differences to a get a new flow.

## Creating checks

This SDK’s aim is to help with the document capture process. It does not actually perform the full document/face checks against our [API](https://documentation.onfido.com/).

In order to perform a full document/face check, you need to call our [API](https://documentation.onfido.com/) to create a check for the applicant on your backend.

### 1. Creating a check

With your API token and applicant id (see [Getting started](#getting-started)), you will need to create an *express* check by making a request to the [create check endpoint](https://documentation.onfido.com/#create-check). If you are just verifying a document, you only have to include a [document report](https://documentation.onfido.com/#document-report) as part of the check. On the other hand, if you are verifying a document and a face photo/video, you will also have to include a [facial similarity report](https://documentation.onfido.com/#facial-similarity-report).
The facial_similarity check can be performed in two different variants: `standard` and `video`. If the SDK is initialised with the `requestedVariant` option for the face step, the check should be created by specifying the value ultimately returned by the `onComplete` callback.
The value of `variant` indicates whether a photo or video was captured and it needs to be included in the request in order to initiate the facial_similarity check.
Example of data returned by the `onComplete` callback:
`{face: {variant: 'standard' | 'video'}}`

If a facial_similarity is requested without `variant`, it will default to `standard`.

```shell
$ curl https://api.onfido.com/v2/applicants/YOUR_APPLICANT_ID/checks \
    -H 'Authorization: Token token=YOUR_API_TOKEN' \
    -d 'type=express' \
    -d 'reports[][name]=document' \
    -d 'reports[][name]=facial_similarity' \
    -d 'reports[][variant]=VARIANT'
```

You will receive a response containing the check id instantly. As document and facial similarity reports do not always return actual [results](https://documentation.onfido.com/#results) straightaway, you need to set up a webhook to get notified when the results are ready.

Finally, as you are testing with the sandbox token, please be aware that the results are pre-determined. You can learn more about sandbox responses [here](https://documentation.onfido.com/#pre-determined-responses).

### 2. Setting up webhooks

Refer to the [Webhooks](https://documentation.onfido.com/#webhooks) section in the API documentation for details.

## Going live

Once you are happy with your integration and are ready to go live, please contact [client-support@onfido.com](mailto:client-support@onfido.com) to obtain live version of the API token. We will have to replace the sandbox token in your code with the live token.

A few things to check before you go live:

- Make sure you have set up webhooks to receive live events
- Make sure you have entered correct billing details inside your [Onfido Dashboard](https://onfido.com/dashboard/)

## More information

### Browser compatibility

![Chrome](https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png) | ![Firefox](https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png) | ![IE](https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png) | ![Safari](https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png)
--- | --- | --- | --- |
Latest ✔ | Latest ✔ | 11+ ✔ | Latest ✔ |

### Support

Please open an issue through [GitHub](https://github.com/onfido/onfido-sdk-ui/issues). Please be as detailed as you can. Remember **not** to submit your token in the issue. Also check the closed issues to check whether it has been previously raised and answered.

If you have any issues that contain sensitive information please send us an email with the ISSUE: at the start of the subject to [js-sdk@onfido.com](mailto:js-sdk@onfido.com).

Previous version of the SDK will be supported for a month after a new major version release. Note that when the support period has expired for an SDK version, no bug fixes will be provided, but the SDK will keep functioning (until further notice).

## How is the Onfido SDK licensed?

The Onfido SDK core and Onfido SDK UI layer are available under the MIT license.
