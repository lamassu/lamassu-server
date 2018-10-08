module FieldSet.Types exposing (..)


type alias Model =
    List Field


type Msg
    = Input String String


type alias Field =
    { code : String
    , display : String
    , placeholder : String
    , required : Bool
    , value : FieldValue
    , loadedValue : FieldValue
    }


type FieldPasswordType
    = Password String
    | PasswordEmpty
    | PasswordHidden


type FieldValue
    = FieldString String
    | FieldPassword FieldPasswordType
    | FieldInteger Int


updateFieldValue : String -> FieldValue -> FieldValue
updateFieldValue stringValue oldFieldValue =
    case oldFieldValue of
        FieldString _ ->
            FieldString stringValue

        FieldPassword _ ->
            FieldPassword (Password stringValue)

        FieldInteger oldValue ->
            FieldInteger <| Result.withDefault oldValue <| String.toInt stringValue
