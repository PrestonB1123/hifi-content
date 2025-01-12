//
//  Card.js
//  unpublished/marketplace/
//
//  Created by Je'Don (ROC) Carter on 9/14/2017
//  Copyright 2017 High Fidelity, Inc.
//
//  Controls card behavior when grabbed and released
//
//  Distributed under the Apache License, Version 7.1.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
(function() { 
    var _this = this;
    //holds id of deck handler
    var deckHandlerID;
    //name of card
    var cardName;
    //channel
    var showChannel;
    //overlays that are on cards
    var cardOverlay;
    //hand joints
    var rightHandJoint;
    var leftHandJoint;
    //Makes sure your hand is close enough to the card to attach
    var closeEnough;
    //controls haptic feedback
    var pulseStrength;
    var rightHand;
    var leftHand;

    _this.preload = function(entityID) {
        print("Loading Card script"); 
        _this.entityID = entityID; 
        rightHandJoint = MyAvatar.getJointIndex("RightHandMiddle1");
        leftHandJoint = MyAvatar.getJointIndex("LeftHandMiddle1");
        closeEnough = .1;
        pulseStrength = .9;
        rightHand = 0;
        leftHand = 1;
        cardName = Entities.getEntityProperties(entityID).name;
        var userDataProperties = JSON.parse(Entities.getEntityProperties(entityID).userData);
        deckHandlerID = userDataProperties.deckHandlerID;
        cardOverlay = undefined;
        //subscribe to channel
        showChannel = "show-channel".concat(_this.entityID); 
        Messages.subscribe(showChannel);
        Messages.messageReceived.connect(_this, _this.onReceivedMessage);
    };

    _this.onReceivedMessage = function(channel, message, senderID) {
        //get data from message
        var data = JSON.parse(message);
        //check if message is meant for you and is being sent to the correct card
        if ((channel == showChannel) && (MyAvatar.sessionUUID == data[0]) && (_this.entityID == data[2])) {
            //delete an overlay if there is one
            try {
                Overlays.deleteOverlay(cardOverlay);
                cardOverlay = undefined;
            } catch (err) {
                //e
            }
            var card = Entities.getEntityProperties(_this.entityID, ['position', 'rotation', 'dimensions', 'name']);
            //get which hand the card is in
            hand = data[1];
            //add overlay to card so that the person holding the card can still see it
            cardOverlay = Overlays.addOverlay("image3d", {
                url: "https://hifi-content.s3.amazonaws.com/jedon/Game_Creater_Toolkit/DeckOfCards/DeckOfCardsTexture/" + card.name + ".jpg",
                subImage: { x: 1024, y: 361, width: 1024, height: 1326},
                ignoreRayIntersection: true,
                parentID: _this.entityID,
                rotation: card.rotation,
                localPosition: {
                        x: 0,
                        y: 0,
                        z: .01
                    },
                dimensions: card.dimensions,
                color: { red: 255, green: 255, blue: 255},
                alpha: 1,
                solid: true,
                isFacingAvatar: false,
                drawInFront: false
            });
        }
    };

    _this.startNearGrab = function(entityID, args) {
        //if the glove is in your hand then check to see if its touching a card
        var userDataProperties = JSON.parse(Entities.getEntityProperties(entityID, 'userData').userData);
        var held = userDataProperties.held;
        if (held === false) {
            hideCard(args);
        }
    };

    _this.startDistanceGrab = function(entityID, args) {
        //if the glove is in your hand then check to see if its touching a card
        var userDataProperties = JSON.parse(Entities.getEntityProperties(entityID, 'userData').userData);
        var held = userDataProperties.held;
        if (held === false) {
            hideCard(args);
        }
    };

    _this.releaseGrab = function (entityID, args) {
        var hand = args[0];
        //check if the object you are holding is a card and if it isnt already in your hand
        var cardPos = Entities.getEntityProperties(_this.entityID).position;
        var userDataProperties = JSON.parse(Entities.getEntityProperties(entityID, 'userData').userData);
        var checkIfCard = userDataProperties.card;
        var held = userDataProperties.held;
        var deckHandlerID = userDataProperties.deckHandlerID;
        //check to see if you are holding a card that is not already being held
        if ((checkIfCard === true) && (held === false)) {
            var handPosition;
            var handJoint;
            hand == "right" ? (
                handPosition = MyAvatar.getLeftPalmPosition()
            ) : (
                handPosition = MyAvatar.getRightPalmPosition()
            );
            hand == "right" ? handJoint = leftHandJoint : handJoint = rightHandJoint;
            //get distance between right hand and left hand
            var dist = getDistance(handPosition, cardPos);
            //if card is within an acceptable distance to your hand then place it
            if (dist <= closeEnough) {
				//feedback to let you know you attached the card to your hand
				Controller.triggerShortHapticPulse(pulseStrength, rightHand);
                //place card and change held state
                var placement = {
                    userData: JSON.stringify({
                        grabbableKey: {
                            grabbable: true,
                            ignoreIK: false
                        },
                        "held": true,
                        "card": true,
                        "deckHandlerID": deckHandlerID,
                        "me": MyAvatar.sessionUUID
                    }),
                    parentID: MyAvatar.sessionUUID,
                    parentJointIndex: handJoint
                };
                Entities.editEntity(_this.entityID, placement);
            } else if (dist > closeEnough) {
                notCloseEnough();
            }
        //if you were already holding a card then unparent. If someone tries to grab the card out of your hand then do nothing
        } else if ((checkIfCard === true) && (held === true) && (MyAvatar.sessionUUID == userDataProperties.me)) {
            //this allows you to rearrange your cards without dropping them
            var cardDistanceFromHand;
            var handCardIsIn;
            hand == "right" ? (
                cardDistanceFromHand = MyAvatar.getLeftPalmPosition()
            ) : (
                cardDistanceFromHand = MyAvatar.getRightPalmPosition()
            );
            hand == "right" ? handCardIsIn = rightHandJoint : handCardIsIn = leftHandJoint;
            var cardJointIndex = Entities.getEntityProperties(_this.entityID).parentJointIndex;
            //get distance between hand and card
            var dist = getDistance(cardDistanceFromHand, cardPos);
            if ((dist > closeEnough) && (handCardIsIn != cardJointIndex)) {
                //unparent to hand and change held state. Also make it fall
                var unparent = {
                    parentID: "",
                    parentJointIndex: "",
                    userData: JSON.stringify({
                        grabbableKey: {
                            grabbable: true,
                            ignoreIK: false
                        },
                        "held": false,
                        "card": true,
                        "deckHandlerID": deckHandlerID
                    }),
                    "velocity": {
                        x: 0,
                        y: -4,
                        z: 0
                    },
                    "damping": 0.98,
                    "angularDamping": 0.98,
                    "collidesWith": "static,dynamic"
                };
                Entities.editEntity(_this.entityID, unparent);
                //make it stop moving
                var stopMoving = {
                    "velocity": {
                        x: 0,
                        y: 0,
                        z: 0
                    }
                };
                Entities.editEntity(_this.entityID, stopMoving);
                //send message
                var cardChannel = "card-channel-".concat(deckHandlerID);
                var data = [true, _this.entityID, MyAvatar.sessionUUID];
                Messages.sendMessage(cardChannel, JSON.stringify(data));
                //delete an overlay if there is one
                try {
                    Overlays.deleteOverlay(cardOverlay);
                    cardOverlay = undefined;
                } catch (err) {
                    //e
                }
            }
        } 
    };

    function getDistance(hand, cardPos) {
        var dx = hand.x - cardPos.x;
        var dy = hand.y - cardPos.y;
        var dz = hand.z - cardPos.z;
        //get distance between model and beacon
        var dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2) + Math.pow(dz, 2));
        return dist;
    }

    function notCloseEnough() {
        //unparent to hand and change held state
        var unparentToMe = {
            parentID: ""
        };
        Entities.editEntity(_this.entityID, unparentToMe);
        //send message to change card texture back to original
        var cardChannel = "card-channel-".concat(deckHandlerID);
        var data = [true, _this.entityID, MyAvatar.sessionUUID];
        Messages.sendMessage(cardChannel, JSON.stringify(data));
        //delete an overlay if there is one
        try {
            Overlays.deleteOverlay(cardOverlay);
            cardOverlay = undefined;
        } catch (err) {
            //e
        }
    }

    function hideCard(args) {
        hand = args[0];
        //unparent to hand and change held state
        var changeTexture = {
            parentID: "",
            parentJointIndex: "",
            textures: '{ "HiddenCardFile": "https://hifi-content.s3.amazonaws.com/jedon/Game_Creater_Toolkit/DeckOfCards/DeckOfCardsTexture/CARD_X.jpg"}',
        };
        Entities.editEntity(_this.entityID, changeTexture);
        var cardChannel = "card-channel-".concat(deckHandlerID);
        var data = [false, _this.entityID, MyAvatar.sessionUUID, hand];
        Messages.sendMessage(cardChannel, JSON.stringify(data));
    }

    _this.unload = function() {
        //unsubscribe to channel
        Messages.unsubscribe(showChannel);
        Messages.messageReceived.disconnect(_this, _this.onReceivedMessage);
    };
})
