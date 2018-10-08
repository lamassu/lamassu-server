module FieldSet.Rest exposing (..)

import Json.Decode as D
import Json.Encode as E
import FieldSet.Types exposing (..)


fieldPasswordDecoder : Bool -> FieldValue
fieldPasswordDecoder present =
    if present then
        FieldPassword PasswordHidden
    else
        FieldPassword PasswordEmpty


badInt : D.Decoder Int
badInt =
    D.oneOf [ D.int ]


fieldValueDecoder : String -> D.Decoder FieldValue
fieldValueDecoder fieldType =
    case fieldType of
        "string" ->
            D.map FieldString D.string

        "password" ->
            D.map fieldPasswordDecoder D.bool

        "integer" ->
            D.map FieldInteger badInt

        _ ->
            D.fail ("Unsupported field type: " ++ fieldType)


fieldDecoder : D.Decoder Field
fieldDecoder =
    (D.field "fieldType" D.string)
        |> D.andThen
            (\fieldType ->
                D.map6 Field
                    (D.field "code" D.string)
                    (D.field "display" D.string)
                    (D.oneOf [ D.field "placeholder" D.string, D.succeed "" ])
                    (D.field "required" D.bool)
                    (D.field "value" (fieldValueDecoder fieldType))
                    (D.field "value" (fieldValueDecoder fieldType))
            )


encodeFieldValue : FieldValue -> E.Value
encodeFieldValue fieldValue =
    case fieldValue of
        FieldString value ->
            E.string value

        FieldPassword value ->
            case value of
                Password s ->
                    E.string s

                _ ->
                    E.null

        FieldInteger value ->
            E.int value


maybeString : Maybe String -> E.Value
maybeString maybeString =
    case maybeString of
        Nothing ->
            E.null

        Just s ->
            E.string s


encodeField : Field -> Maybe E.Value
encodeField field =
    if isDirty field then
        Just
            (E.object
                [ ( "code", E.string field.code )
                , ( "value", encodeFieldValue field.value )
                ]
            )
    else
        Nothing


isDirty : Field -> Bool
isDirty field =
    field.value /= field.loadedValue
