module ConfigTypes exposing (..)

import String
import Selectize


type alias DisplayRec =
    { code : String
    , display : String
    }


type Machine
    = MachineId String
    | GlobalMachine


type alias MachineDisplay =
    { machine : Machine
    , display : String
    }


type ConfigScope
    = Global
    | Specific
    | Both


type FieldHolder
    = ParsingError String
    | ValidationError String
    | FieldOk FieldValue
    | FieldEmpty


type alias FieldScope =
    { crypto : Crypto
    , machine : Machine
    }


type alias FieldLocator =
    { fieldScope : FieldScope
    , code : String
    , fieldType : FieldType
    , fieldClass : Maybe String
    }


type FieldComponent
    = InputBoxComponent
    | TextAreaComponent
    | SelectizeComponent Selectize.State


type alias FieldInstance =
    { fieldLocator : FieldLocator
    , component : FieldComponent
    , fieldHolder : FieldHolder
    , loadedFieldHolder : FieldHolder
    , fieldValidation : List FieldValidator
    , fieldEnabledIfAny : List String
    , fieldEnabledIfAll : List String
    , readOnly : Bool
    , inScope : Bool
    }


type alias ResolvedFieldInstance =
    { fieldLocator : FieldLocator
    , fieldValue : Maybe FieldValue
    }


type alias Field =
    { fieldLocator : FieldLocator
    , fieldValue : FieldValue
    , fieldEnabledIfAny : List String
    , fieldEnabledIfAll : List String
    , inScope : Bool
    }


type alias FieldMeta =
    { fieldLocator : FieldLocator
    , fieldEnabledIfAny : List String
    , fieldEnabledIfAll : List String
    , inScope : Bool
    }


type FieldType
    = FieldStringType
    | FieldPercentageType
    | FieldIntegerType
    | FieldDecimalType
    | FieldOnOffType
    | FieldAccountType
    | FieldFiatCurrencyType
    | FieldCryptoCurrencyType
    | FieldLanguageType
    | FieldCountryType
    | FieldTextAreaType
    | FieldMarkdownType


type FieldValue
    = FieldStringValue String
    | FieldPercentageValue Float
    | FieldIntegerValue Int
    | FieldDecimalValue Float
    | FieldOnOffValue Bool
    | FieldAccountValue String
    | FieldFiatCurrencyValue String
    | FieldCryptoCurrencyValue (List String)
    | FieldLanguageValue (List String)
    | FieldCountryValue String
    | FieldTextAreaValue String
    | FieldMarkdownValue String


type FieldValidator
    = FieldMin Int
    | FieldMax Int
    | FieldRequired


type DisplayTop
    = DisplayTopLeader Int String
    | DisplayTopSolo String
    | DisplayTopNone


type alias FieldDescriptor =
    { code : String
    , cryptoScope : ConfigScope
    , machineScope : ConfigScope
    , displayTop : DisplayTop
    , displayBottom : String
    , displayCount : Maybe Int
    , fieldType : FieldType
    , fieldValidation : List FieldValidator
    , fieldClass : Maybe String
    , fieldEnabledIfAny : List String
    , fieldEnabledIfAll : List String
    , readOnly : Bool
    }


type alias ConfigSchema =
    { code : String
    , display : String
    , cryptoScope : ConfigScope
    , machineScope : ConfigScope
    , entries : List FieldDescriptor
    }


type alias ConfigGroup =
    { schema : ConfigSchema
    , values : List Field
    , selectedCryptos : List String
    , data : ConfigData
    }


type alias AccountRec =
    { code : String
    , display : String
    , class : String
    , cryptos : Maybe (List Crypto)
    }


accountRecToDisplayRec : AccountRec -> DisplayRec
accountRecToDisplayRec accountRec =
    { code = accountRec.code
    , display = accountRec.display
    }


type alias ConfigData =
    { cryptoCurrencies : List CryptoDisplay
    , currencies : List DisplayRec
    , languages : List DisplayRec
    , countries : List DisplayRec
    , accounts : List AccountRec
    , machines : List MachineDisplay
    }


type alias FieldCollection =
    { fields : List Field
    , fieldInstances : List FieldInstance
    }


initFieldCollection : FieldCollection
initFieldCollection =
    { fields = []
    , fieldInstances = []
    }


globalCryptoDisplay : CryptoDisplay
globalCryptoDisplay =
    { crypto = GlobalCrypto
    , display = "Global"
    }


globalMachineDisplay : MachineDisplay
globalMachineDisplay =
    { machine = GlobalMachine
    , display = "Global"
    }


fieldValueToDisplay : FieldValue -> String
fieldValueToDisplay fieldValue =
    case fieldValue of
        FieldOnOffValue v ->
            if v then
                "On"
            else
                "Off"

        _ ->
            fieldValueToString fieldValue


fieldValueToString : FieldValue -> String
fieldValueToString fieldValue =
    case fieldValue of
        FieldStringValue v ->
            v

        FieldPercentageValue v ->
            toString v

        FieldIntegerValue v ->
            toString v

        FieldDecimalValue v ->
            toString v

        FieldOnOffValue v ->
            if v then
                "on"
            else
                "off"

        FieldAccountValue v ->
            v

        FieldFiatCurrencyValue v ->
            v

        FieldCryptoCurrencyValue v ->
            String.join "," v

        FieldLanguageValue v ->
            String.join "," v

        FieldCountryValue v ->
            v

        FieldTextAreaValue v ->
            v

        FieldMarkdownValue v ->
            v


machineToString : Machine -> String
machineToString machine =
    case machine of
        GlobalMachine ->
            "global"

        MachineId machineId ->
            machineId


listMachines : ConfigGroup -> List MachineDisplay
listMachines configGroup =
    case configGroup.schema.machineScope of
        Specific ->
            configGroup.data.machines

        Global ->
            [ globalMachineDisplay ]

        Both ->
            globalMachineDisplay :: configGroup.data.machines


isCrypto : String -> CryptoDisplay -> Bool
isCrypto cryptoString cryptoDisplay =
    case cryptoDisplay.crypto of
        GlobalCrypto ->
            cryptoString == "global"

        CryptoCode string ->
            cryptoString == string


lookupCryptoDisplay : List CryptoDisplay -> String -> Maybe CryptoDisplay
lookupCryptoDisplay cryptoDisplays cryptoString =
    List.filter (isCrypto cryptoString) cryptoDisplays
        |> List.head


fieldHolderToCryptoStrings : FieldHolder -> List String
fieldHolderToCryptoStrings fieldHolder =
    case fieldHolder of
        FieldOk fieldValue ->
            case fieldValue of
                FieldCryptoCurrencyValue cryptoStrings ->
                    cryptoStrings

                _ ->
                    []

        _ ->
            []


allCryptos : List CryptoDisplay -> ConfigScope -> List String -> List CryptoDisplay
allCryptos cryptoDisplays cryptoScope cryptoStrings =
    let
        allSpecificCryptos =
            List.filterMap (lookupCryptoDisplay cryptoDisplays) cryptoStrings
    in
        case cryptoScope of
            Global ->
                [ globalCryptoDisplay ]

            Specific ->
                allSpecificCryptos

            Both ->
                globalCryptoDisplay :: allSpecificCryptos


listCryptos : ConfigGroup -> List CryptoDisplay
listCryptos configGroup =
    case configGroup.schema.cryptoScope of
        Specific ->
            configGroup.data.cryptoCurrencies

        Global ->
            [ globalCryptoDisplay ]

        Both ->
            globalCryptoDisplay :: configGroup.data.cryptoCurrencies


fieldScopes : ConfigGroup -> List FieldScope
fieldScopes configGroup =
    let
        machines =
            List.map .machine (listMachines configGroup)

        cryptos =
            List.map .crypto (listCryptos configGroup)

        cryptoScopes crypto =
            List.map (\machine -> { machine = machine, crypto = crypto }) machines
    in
        List.concatMap cryptoScopes cryptos


stringToCrypto : String -> Crypto
stringToCrypto string =
    case string of
        "global" ->
            GlobalCrypto

        _ ->
            CryptoCode string


fieldHolderToMaybe : FieldHolder -> Maybe FieldValue
fieldHolderToMaybe fieldHolder =
    case fieldHolder of
        FieldOk fieldValue ->
            Just fieldValue

        _ ->
            Nothing


resultToFieldHolder : Result String FieldValue -> FieldHolder
resultToFieldHolder result =
    case result of
        Ok fieldValue ->
            FieldOk fieldValue

        Err s ->
            ParsingError s


stringToFieldHolder : FieldType -> String -> FieldHolder
stringToFieldHolder fieldType s =
    if (String.isEmpty s) then
        FieldEmpty
    else
        case fieldType of
            FieldStringType ->
                FieldOk (FieldStringValue s)

            FieldPercentageType ->
                String.toFloat s
                    |> Result.map FieldPercentageValue
                    |> resultToFieldHolder

            FieldIntegerType ->
                String.toInt s
                    |> Result.map FieldIntegerValue
                    |> resultToFieldHolder

            FieldDecimalType ->
                String.toFloat s
                    |> Result.map FieldDecimalValue
                    |> resultToFieldHolder

            FieldOnOffType ->
                case s of
                    "on" ->
                        FieldOk (FieldOnOffValue True)

                    "off" ->
                        FieldOk (FieldOnOffValue False)

                    _ ->
                        ParsingError ("Unsupported value for OnOff: " ++ s)

            FieldAccountType ->
                FieldOk (FieldAccountValue s)

            FieldFiatCurrencyType ->
                FieldOk (FieldFiatCurrencyValue s)

            FieldCryptoCurrencyType ->
                FieldOk (FieldCryptoCurrencyValue [ s ])

            FieldLanguageType ->
                FieldOk (FieldLanguageValue [ s ])

            FieldCountryType ->
                FieldOk (FieldCountryValue s)

            FieldTextAreaType ->
                FieldOk (FieldTextAreaValue s)

            FieldMarkdownType ->
                FieldOk (FieldMarkdownValue s)


groupMember : ConfigGroup -> String -> Bool
groupMember configGroup fieldCode =
    List.any (.code >> ((==) fieldCode)) configGroup.schema.entries


fieldHolderMap : a -> (FieldValue -> a) -> FieldHolder -> a
fieldHolderMap default mapper fieldHolder =
    case fieldHolder of
        FieldOk v ->
            mapper v

        _ ->
            default


type Crypto
    = CryptoCode String
    | GlobalCrypto


type alias CryptoDisplay =
    { crypto : Crypto
    , display : String
    }


cryptoToString : Crypto -> String
cryptoToString crypto =
    case crypto of
        GlobalCrypto ->
            "global"

        CryptoCode code ->
            code
