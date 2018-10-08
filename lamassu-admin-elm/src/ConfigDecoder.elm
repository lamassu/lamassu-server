module ConfigDecoder exposing (..)

import Json.Decode exposing (..)
import ConfigTypes exposing (..)
import Json.Decode.Pipeline exposing (decode, required, optional, hardcoded, custom)
import BasicTypes exposing (..)


fieldValueTypeDecoder : String -> Decoder FieldValue
fieldValueTypeDecoder fieldType =
    case fieldType of
        "string" ->
            map FieldStringValue (field "value" string)

        "percentage" ->
            map FieldPercentageValue (field "value" float)

        "integer" ->
            map FieldIntegerValue (field "value" int)

        "decimal" ->
            map FieldDecimalValue (field "value" float)

        "onOff" ->
            map FieldOnOffValue (field "value" bool)

        "account" ->
            map FieldFiatCurrencyValue (field "value" string)

        "fiatCurrency" ->
            map FieldFiatCurrencyValue (field "value" string)

        "cryptoCurrency" ->
            map FieldCryptoCurrencyValue (field "value" (list string))

        "language" ->
            map FieldLanguageValue (field "value" (list string))

        "country" ->
            map FieldCountryValue (field "value" string)

        "textarea" ->
            map FieldTextAreaValue (field "value" string)

        "markdown" ->
            map FieldMarkdownValue (field "value" string)

        _ ->
            fail ("Unsupported field type: " ++ fieldType)


fieldValueDecoder : Decoder FieldValue
fieldValueDecoder =
    (field "fieldType" string) |> andThen fieldValueTypeDecoder


fieldScopeDecoder : Decoder FieldScope
fieldScopeDecoder =
    map2 FieldScope
        (field "crypto" cryptoDecoder)
        (field "machine" machineDecoder)


nullOr : Decoder a -> Decoder (Maybe a)
nullOr decoder =
    oneOf
        [ null Nothing
        , map Just decoder
        ]


fieldLocatorDecoder : Decoder FieldLocator
fieldLocatorDecoder =
    map4 FieldLocator
        (field "fieldScope" fieldScopeDecoder)
        (field "code" string)
        ((field "fieldType" string) |> andThen fieldTypeDecoder)
        (field "fieldClass" (nullOr string))


fieldDecoder : Decoder Field
fieldDecoder =
    map5 Field
        (field "fieldLocator" fieldLocatorDecoder)
        (field "fieldValue" fieldValueDecoder)
        (field "fieldEnabledIfAny" (list string))
        (field "fieldEnabledIfAll" (list string))
        (succeed True)


string2machine : String -> Machine
string2machine s =
    if s == "global" then
        GlobalMachine
    else
        MachineId s


machineDecoder : Decoder Machine
machineDecoder =
    map string2machine string


cryptoDecoder : Decoder Crypto
cryptoDecoder =
    map stringToCrypto string


displayRecDecoder : Decoder DisplayRec
displayRecDecoder =
    map2 DisplayRec
        (field "code" string)
        (field "display" string)


machineDisplayDecoder : Decoder MachineDisplay
machineDisplayDecoder =
    map2 MachineDisplay
        (field "machine" machineDecoder)
        (field "display" string)


cryptoDisplayDecoder : Decoder CryptoDisplay
cryptoDisplayDecoder =
    map2 CryptoDisplay
        (field "crypto" cryptoDecoder)
        (field "display" string)


stringToConfigScope : String -> Decoder ConfigScope
stringToConfigScope s =
    case s of
        "global" ->
            succeed Global

        "specific" ->
            succeed Specific

        "both" ->
            succeed Both

        _ ->
            fail ("No such ConfigScope " ++ s)


basicFieldTypeDecoder : String -> Decoder FieldType
basicFieldTypeDecoder s =
    case s of
        "string" ->
            succeed FieldStringType

        "percentage" ->
            succeed FieldPercentageType

        "integer" ->
            succeed FieldIntegerType

        "decimal" ->
            succeed FieldDecimalType

        "onOff" ->
            succeed FieldOnOffType

        "account" ->
            succeed FieldAccountType

        "fiatCurrency" ->
            succeed FieldFiatCurrencyType

        "cryptoCurrency" ->
            succeed FieldCryptoCurrencyType

        "language" ->
            succeed FieldLanguageType

        "country" ->
            succeed FieldCountryType

        "textarea" ->
            succeed FieldTextAreaType

        "markdown" ->
            succeed FieldMarkdownType

        _ ->
            fail ("No such FieldType " ++ s)


configScopeDecoder : Decoder ConfigScope
configScopeDecoder =
    string
        |> andThen stringToConfigScope


fieldTypeDecoder : String -> Decoder FieldType
fieldTypeDecoder fieldType =
    basicFieldTypeDecoder fieldType


fieldValidatorDecode : String -> Decoder FieldValidator
fieldValidatorDecode code =
    case code of
        "min" ->
            map FieldMin (field "min" int)

        "max" ->
            map FieldMax (field "max" int)

        "required" ->
            succeed FieldRequired

        _ ->
            fail ("Unsupported fieldValidator: " ++ code)


fieldValidatorDecoder : Decoder FieldValidator
fieldValidatorDecoder =
    (field "code" string)
        |> andThen fieldValidatorDecode


displayTopDecoderHelper : Maybe Int -> Decoder DisplayTop
displayTopDecoderHelper maybeDisplayTopCount =
    case maybeDisplayTopCount of
        Nothing ->
            (maybe <| (field "displayTop" string))
                |> map (DisplayTopSolo << (Maybe.withDefault ""))

        Just 0 ->
            succeed DisplayTopNone

        Just 1 ->
            succeed DisplayTopNone

        Just x ->
            map (DisplayTopLeader x) (field "displayTop" string)


displayTopDecoder : Decoder DisplayTop
displayTopDecoder =
    (maybe <| (field "displayTopCount" int))
        |> andThen displayTopDecoderHelper


fieldDescriptorDecoder : Decoder FieldDescriptor
fieldDescriptorDecoder =
    decode FieldDescriptor
        |> required "code" string
        |> required "cryptoScope" configScopeDecoder
        |> required "machineScope" configScopeDecoder
        |> custom displayTopDecoder
        |> required "displayBottom" string
        |> custom (maybe (field "displayCount" int))
        |> custom (field "fieldType" string |> andThen fieldTypeDecoder)
        |> custom (field "fieldValidation" <| list fieldValidatorDecoder)
        |> required "fieldClass" (nullable string)
        |> required "fieldEnabledIfAny" (list string)
        |> required "fieldEnabledIfAll" (list string)
        |> optional "readOnly" bool False


configSchemaDecoder : Decoder ConfigSchema
configSchemaDecoder =
    map5 ConfigSchema
        (field "code" string)
        (field "display" string)
        (field "cryptoScope" configScopeDecoder)
        (field "machineScope" configScopeDecoder)
        (field "entries" (list fieldDescriptorDecoder))


configGroupDecoder : Decoder ConfigGroup
configGroupDecoder =
    map4 ConfigGroup
        (field "schema" configSchemaDecoder)
        (field "values" (list fieldDecoder))
        (field "selectedCryptos" (list string))
        (field "data" configDataDecoder)


accountRecDecoder : Decoder AccountRec
accountRecDecoder =
    oneOf
        [ map4 AccountRec
            (field "code" string)
            (field "display" string)
            (field "class" string)
            (field "cryptos" (map Just (list cryptoDecoder)))
        , map4 AccountRec
            (field "code" string)
            (field "display" string)
            (field "class" string)
            (succeed Nothing)
        ]


configDataDecoder : Decoder ConfigData
configDataDecoder =
    map6 ConfigData
        (field "cryptoCurrencies" (list cryptoDisplayDecoder))
        (field "currencies" (list displayRecDecoder))
        (field "languages" (list displayRecDecoder))
        (field "countries" (list displayRecDecoder))
        (field "accounts" (list accountRecDecoder))
        (field "machines" (list machineDisplayDecoder))
