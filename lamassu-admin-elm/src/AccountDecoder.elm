module AccountDecoder exposing (..)

import Json.Decode exposing (..)
import FieldSet.Rest exposing (..)
import AccountTypes exposing (..)


accountDecoder : Decoder Account
accountDecoder =
    map3 Account
        (field "code" string)
        (field "display" string)
        (field "fields" (list fieldDecoder))


type alias AccountResult =
    Result String Account


decodeAccount : String -> AccountResult
decodeAccount string =
    decodeString accountDecoder string
