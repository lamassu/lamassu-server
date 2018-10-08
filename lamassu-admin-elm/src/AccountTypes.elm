module AccountTypes exposing (..)

import FieldSet.Types exposing (..)


type alias Account =
    { code : String
    , display : String
    , fields : List Field
    }
