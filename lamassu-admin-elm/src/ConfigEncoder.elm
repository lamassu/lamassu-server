module ConfigEncoder exposing (..)

import Json.Encode exposing (..)
import List
import ConfigTypes exposing (..)
import BasicTypes exposing (..)


encodeFieldValueObject : String -> Value -> Value
encodeFieldValueObject fieldTypeStr value =
    object [ ( "fieldType", string fieldTypeStr ), ( "value", value ) ]


encodeFieldValue : FieldValue -> Value
encodeFieldValue fieldValue =
    case fieldValue of
        FieldStringValue value ->
            encodeFieldValueObject "string" (string value)

        FieldPercentageValue value ->
            encodeFieldValueObject "percentage" (float value)

        FieldIntegerValue value ->
            encodeFieldValueObject "integer" (int value)

        FieldDecimalValue value ->
            encodeFieldValueObject "decimal" (float value)

        FieldOnOffValue value ->
            encodeFieldValueObject "onOff" (bool value)

        FieldAccountValue value ->
            encodeFieldValueObject "account" (string value)

        FieldFiatCurrencyValue value ->
            encodeFieldValueObject "fiatCurrency" (string value)

        FieldCryptoCurrencyValue value ->
            encodeFieldValueObject "cryptoCurrency" (list (List.map string value))

        FieldLanguageValue value ->
            encodeFieldValueObject "language" (list (List.map string value))

        FieldCountryValue value ->
            encodeFieldValueObject "country" (string value)

        FieldTextAreaValue value ->
            encodeFieldValueObject "textarea" (string value)

        FieldMarkdownValue value ->
            encodeFieldValueObject "markdown" (string value)


encodeCrypto : Crypto -> Value
encodeCrypto crypto =
    case crypto of
        CryptoCode cryptoCode ->
            string cryptoCode

        GlobalCrypto ->
            string "global"


encodeMachine : Machine -> Value
encodeMachine machine =
    case machine of
        MachineId machineId ->
            string machineId

        GlobalMachine ->
            string "global"


encodeFieldScope : FieldScope -> Value
encodeFieldScope fieldScope =
    Json.Encode.object
        [ ( "crypto", encodeCrypto fieldScope.crypto )
        , ( "machine", encodeMachine fieldScope.machine )
        ]


fieldTypeEncoder : FieldType -> Value
fieldTypeEncoder fieldType =
    case fieldType of
        FieldStringType ->
            string "string"

        FieldPercentageType ->
            string "percentage"

        FieldIntegerType ->
            string "integer"

        FieldDecimalType ->
            string "decimal"

        FieldOnOffType ->
            string "onOff"

        FieldAccountType ->
            string "account"

        FieldFiatCurrencyType ->
            string "fiatCurrency"

        FieldCryptoCurrencyType ->
            string "cryptoCurrency"

        FieldLanguageType ->
            string "language"

        FieldCountryType ->
            string "country"

        FieldTextAreaType ->
            string "textarea"

        FieldMarkdownType ->
            string "markdown"


maybeString : Maybe String -> Value
maybeString maybeString =
    case maybeString of
        Nothing ->
            null

        Just s ->
            string s


encodeFieldLocator : FieldLocator -> Value
encodeFieldLocator fieldLocator =
    Json.Encode.object
        [ ( "fieldScope", encodeFieldScope fieldLocator.fieldScope )
        , ( "code", string fieldLocator.code )
        , ( "fieldType", fieldTypeEncoder fieldLocator.fieldType )
        , ( "fieldClass", maybeString fieldLocator.fieldClass )
        ]


encodeFieldResult : FieldInstance -> Maybe Value
encodeFieldResult fieldInstance =
    let
        encode value =
            Json.Encode.object
                [ ( "fieldLocator", encodeFieldLocator fieldInstance.fieldLocator )
                , ( "fieldValue", value )
                ]

        dirtyEncode fieldHolder =
            case fieldHolder of
                ParsingError fieldValue ->
                    Nothing

                ValidationError fieldValue ->
                    Nothing

                FieldOk fieldValue ->
                    if (fieldInstance.loadedFieldHolder == fieldHolder) then
                        Nothing
                    else
                        Just <| encode <| encodeFieldValue fieldValue

                FieldEmpty ->
                    if (fieldInstance.loadedFieldHolder == fieldHolder) then
                        Nothing
                    else
                        Just <| encode null
    in
        dirtyEncode fieldInstance.fieldHolder


encodeResults : String -> List FieldInstance -> Maybe Value
encodeResults configGroupCode fieldInstances =
    let
        results =
            List.filterMap encodeFieldResult fieldInstances
    in
        if List.isEmpty results then
            Nothing
        else
            Json.Encode.object
                [ ( "groupCode", string configGroupCode )
                , ( "values", list (List.filterMap encodeFieldResult fieldInstances) )
                ]
                |> Just
