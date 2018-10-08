module AccountEncoder exposing (..)

import Json.Encode exposing (..)
import AccountTypes exposing (..)
import List
import FieldSet.Rest exposing (..)


encodeAccount : Account -> Value
encodeAccount account =
    Json.Encode.object
        [ ( "code", string account.code )
        , ( "display", string account.display )
        , ( "fields", list (List.filterMap encodeField account.fields) )
        ]
