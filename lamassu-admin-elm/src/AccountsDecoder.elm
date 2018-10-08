module AccountsDecoder exposing (..)

import Json.Decode exposing (..)


accountDecoder : Decoder ( String, String )
accountDecoder =
    map2 (,)
        (field "code" string)
        (field "display" string)


accountsDecoder : Decoder (List ( String, String ))
accountsDecoder =
    map identity
        (field "accounts" (list accountDecoder))
