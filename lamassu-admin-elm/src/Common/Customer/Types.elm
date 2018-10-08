module Common.Customer.Types exposing (..)

import Date exposing (Date)


type Authorized
    = Automatic
    | Blocked
    | Verified


type alias Customers =
    List Customer


type alias IdCardData =
    { uid : String }

type alias Customer =
    { id : String
    , name : Maybe String
    , phone : Maybe String
    , phoneAt : Maybe Date
    , smsOverride : Authorized
    , smsOverrideByName : Maybe String
    , smsOverrideAt : Maybe Date
    , created : Date
    , status : Maybe String
    , authorizedOverride : Authorized
    , authorizedOverrideByName : Maybe String
    , authorizedOverrideAt : Maybe Date
    , authorizedAt : Maybe Date
    , idCardData : Maybe IdCardData
    , idCardDataOverride : Authorized
    , idCardDataOverrideByName : Maybe String
    , idCardDataOverrideAt : Maybe Date
    , idCardDataAt : Maybe Date
    , idCardPhotoPath : Maybe String
    , idCardPhotoOverride : Authorized
    , idCardPhotoOverrideByName : Maybe String
    , idCardPhotoOverrideAt : Maybe Date
    , idCardPhotoAt : Maybe Date
    , sanctions : Maybe Bool
    , sanctionsOverride : Authorized
    , sanctionsOverrideByName : Maybe String
    , sanctionsOverrideAt : Maybe Date
    , sanctionsAt : Maybe Date
    , frontCameraPath : Maybe String
    , frontCameraOverride : Authorized
    , frontCameraOverrideByName : Maybe String
    , frontCameraOverrideAt : Maybe Date
    , frontCameraAt : Maybe Date
    , dailyVolume : Maybe String
    }


authorizedToString : Authorized -> String
authorizedToString model =
    case model of
        Verified ->
            "verified"

        Blocked ->
            "blocked"

        Automatic ->
            "automatic"
