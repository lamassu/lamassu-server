module Common.Customer.Decoder exposing (..)

import Json.Decode exposing (..)
import Json.Decode.Extra exposing (date, fromResult)
import Json.Decode.Pipeline exposing (decode, required, optional, hardcoded)
import Common.Customer.Types exposing (..)


customersDecoder : Decoder (List Customer)
customersDecoder =
    field "customers" (list customerDecoder)


mapAuthorizedTypes : String -> Decoder Authorized
mapAuthorizedTypes s =
    case s of
        "blocked" ->
            succeed Blocked

        "verified" ->
            succeed Verified

        "automatic" ->
            succeed Automatic

        _ ->
            fail ("No such type " ++ s)


authorizedDecoder : Decoder Authorized
authorizedDecoder =
    string
        |> andThen mapAuthorizedTypes


idCardDataDecoder : Decoder IdCardData
idCardDataDecoder =
    decode IdCardData
        |> required "uid" string

customerDecoder : Decoder Customer
customerDecoder =
    decode Customer
        |> required "id" string
        |> required "name" (nullable string)
        |> required "phone" (nullable string)
        |> required "phoneAt" (nullable date)
        |> required "smsOverride" authorizedDecoder
        |> required "smsOverrideByName" (nullable string)
        |> required "smsOverrideAt" (nullable date)
        |> required "created" date
        |> required "status" (nullable string)
        |> required "authorizedOverride" authorizedDecoder
        |> required "authorizedOverrideByName" (nullable string)
        |> required "authorizedOverrideAt" (nullable date)
        |> required "authorizedAt" (nullable date)
        |> required "idCardData" (nullable idCardDataDecoder)
        |> required "idCardDataOverride" authorizedDecoder
        |> required "idCardDataOverrideByName" (nullable string)
        |> required "idCardDataOverrideAt" (nullable date)
        |> required "idCardDataAt" (nullable date)
        |> required "idCardPhotoPath" (nullable string)
        |> required "idCardPhotoOverride" authorizedDecoder
        |> required "idCardPhotoOverrideByName" (nullable string)
        |> required "idCardPhotoOverrideAt" (nullable date)
        |> required "idCardPhotoAt" (nullable date)
        |> required "sanctions" (nullable bool)
        |> required "sanctionsOverride" authorizedDecoder
        |> required "sanctionsOverrideByName" (nullable string)
        |> required "sanctionsOverrideAt" (nullable date)
        |> required "sanctionsAt" (nullable date)
        |> required "frontCameraPath" (nullable string)
        |> required "frontCameraOverride" authorizedDecoder
        |> required "frontCameraOverrideByName" (nullable string)
        |> required "frontCameraOverrideAt" (nullable date)
        |> required "frontCameraAt" (nullable date)
        |> required "dailyVolume" (nullable string)
