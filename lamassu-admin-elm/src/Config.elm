module Config exposing (..)

import Html exposing (..)
import Html.Events exposing (..)
import Html.Attributes exposing (defaultValue, placeholder, type_, disabled, colspan)
import Html.Keyed
import Navigation
import RemoteData exposing (..)
import Http
import HttpBuilder exposing (..)
import ConfigTypes exposing (..)
import ConfigDecoder exposing (..)
import ConfigEncoder exposing (..)
import Css.Admin exposing (..)
import Css.Classes as C
import Selectize
import Maybe
import SelectizeHelper exposing (buildConfig)
import FuzzyMatch
import Process
import Time exposing (second)
import Task
import StatusTypes
import Maybe.Extra


type alias WebConfigGroup =
    RemoteData.WebData ConfigGroup


type SavingStatus
    = Saving
    | Saved
    | Editing
    | NotSaving


type alias Model =
    { webConfigGroup : WebConfigGroup
    , fieldCollection : FieldCollection
    , crypto : Maybe Crypto
    , fiat : Maybe String
    , status : SavingStatus
    , focused : Maybe FieldLocator
    , rates : List StatusTypes.Rate
    }


type alias ResolvedModel =
    { configGroup : ConfigGroup
    , fieldCollection : FieldCollection
    , crypto : Crypto
    , fiat : String
    , status : SavingStatus
    , focused : Maybe FieldLocator
    }


toResolvedModel : Model -> ConfigGroup -> ResolvedModel
toResolvedModel model configGroup =
    { configGroup = configGroup
    , fieldCollection = model.fieldCollection
    , crypto = Maybe.withDefault GlobalCrypto model.crypto
    , fiat = Maybe.withDefault "Fiat" model.fiat
    , status = model.status
    , focused = model.focused
    }


getForm : String -> Cmd Msg
getForm code =
    get ("/api/config/" ++ code)
        |> withExpect (Http.expectJson configGroupDecoder)
        |> send RemoteData.fromResult
        |> Cmd.map Load


postForm : String -> List FieldInstance -> Cmd Msg
postForm configGroupCode fieldInstances =
    let
        maybeResults =
            encodeResults configGroupCode fieldInstances
    in
        case maybeResults of
            Nothing ->
                Cmd.none

            Just results ->
                post ("/api/config")
                    |> withJsonBody (results)
                    |> withExpect (Http.expectJson configGroupDecoder)
                    |> send RemoteData.fromResult
                    |> Cmd.map Load


postFormNoLoad : String -> List FieldInstance -> Cmd Msg
postFormNoLoad configGroupCode fieldInstances =
    postForm configGroupCode fieldInstances
        |> Cmd.map (\_ -> NoOp)


init : Model
init =
    { webConfigGroup = RemoteData.NotAsked
    , fieldCollection = initFieldCollection
    , crypto = Nothing
    , fiat = Nothing
    , status = NotSaving
    , focused = Nothing
    , rates = []
    }


load : Model -> String -> Maybe String -> ( Model, Cmd Msg )
load model code maybeCryptoCodeString =
    let
        crypto =
            Maybe.map stringToCrypto maybeCryptoCodeString
    in
        ( { model | crypto = crypto }, getForm code )



-- UPDATE


similar : (x -> y) -> x -> x -> Bool
similar mapper a b =
    (==) (mapper a) (mapper b)


placeField : List Field -> Field -> List Field
placeField fieldList field =
    let
        maybeOldField =
            List.filter (similar .fieldLocator field) fieldList
                |> List.head

        newField =
            case maybeOldField of
                Nothing ->
                    field

                Just oldField ->
                    { oldField | fieldValue = field.fieldValue }
    in
        newField :: (List.filter (not << (similar .fieldLocator field)) fieldList)


fieldHolderToList : FieldHolder -> List String
fieldHolderToList fieldHolder =
    case fieldHolder of
        FieldOk fieldValue ->
            case fieldValue of
                FieldLanguageValue v ->
                    v

                FieldCryptoCurrencyValue v ->
                    v

                _ ->
                    Debug.crash "Not a list type"

        _ ->
            []


emptyToNothing : List x -> Maybe (List x)
emptyToNothing list =
    if (List.isEmpty list) then
        Nothing
    else
        Just list


listToFieldHolder : (List a -> FieldValue) -> List a -> FieldHolder
listToFieldHolder modifier list =
    if List.isEmpty list then
        FieldEmpty
    else
        FieldOk <| modifier <| list


updateStringFieldInstance : List FieldInstance -> FieldLocator -> Maybe String -> FieldInstance -> FieldInstance
updateStringFieldInstance fieldInstances fieldLocator maybeString fieldInstance =
    if fieldInstance.fieldLocator == fieldLocator then
        case fieldLocator.fieldType of
            FieldLanguageType ->
                let
                    list =
                        fieldHolderToList fieldInstance.fieldHolder

                    newList =
                        case maybeString of
                            Nothing ->
                                List.take ((List.length list) - 1) list

                            Just s ->
                                list ++ [ s ]
                in
                    { fieldInstance | fieldHolder = listToFieldHolder FieldLanguageValue newList }

            FieldCryptoCurrencyType ->
                let
                    list =
                        fieldHolderToList fieldInstance.fieldHolder

                    newList =
                        case maybeString of
                            Nothing ->
                                List.take ((List.length list) - 1) list

                            Just s ->
                                list ++ [ s ]
                in
                    { fieldInstance | fieldHolder = listToFieldHolder FieldCryptoCurrencyValue newList }

            _ ->
                let
                    fieldHolder =
                        case maybeString of
                            Nothing ->
                                FieldEmpty

                            Just s ->
                                stringToFieldHolder fieldLocator.fieldType s
                in
                    { fieldInstance | fieldHolder = fieldHolder }
    else
        fieldInstance


updateInput : FieldLocator -> Maybe String -> Model -> Model
updateInput fieldLocator maybeValueString model =
    let
        oldFieldInstances =
            model.fieldCollection.fieldInstances

        fieldInstances =
            List.map (updateStringFieldInstance oldFieldInstances fieldLocator maybeValueString)
                oldFieldInstances

        fieldCollection =
            model.fieldCollection

        newFieldCollection =
            { fieldCollection | fieldInstances = fieldInstances }
    in
        { model | fieldCollection = newFieldCollection }



-- View


fieldTypeToInputType : FieldType -> String
fieldTypeToInputType fieldType =
    "string"


unitDisplay : String -> FieldInstance -> Html Msg
unitDisplay fiat fieldInstance =
    case fieldInstance.fieldLocator.fieldType of
        FieldPercentageType ->
            div [ class [ C.UnitDisplay ] ] [ text "%" ]

        FieldIntegerType ->
            case fieldInstance.fieldLocator.fieldClass of
                Just "fiat" ->
                    div [ class [ C.UnitDisplay ] ] [ text fiat ]

                Just "banknotes" ->
                    div [ class [ C.UnitDisplay ] ] [ text "notes" ]

                Just _ ->
                    div [] []

                Nothing ->
                    div [] []

        _ ->
            div [] []


fieldInstanceClasses : FieldInstance -> List C.CssClasses
fieldInstanceClasses fieldInstance =
    case fieldInstance.fieldLocator.fieldType of
        FieldPercentageType ->
            [ C.ShortCell ]

        FieldIntegerType ->
            [ C.ShortCell ]

        FieldAccountType ->
            [ C.MediumCell ]

        FieldStringType ->
            [ C.MediumCell, C.TextCell ]

        FieldLanguageType ->
            [ C.MediumCell ]

        FieldCryptoCurrencyType ->
            [ C.MediumCell ]

        _ ->
            [ C.ShortCell ]


textInput : String -> FieldInstance -> Maybe FieldValue -> Maybe FieldValue -> Bool -> Html Msg
textInput fiat fieldInstance maybeFieldValue maybeFallbackFieldValue enabled =
    let
        fieldLocator =
            fieldInstance.fieldLocator

        maybeSpecificString =
            Maybe.map fieldValueToString maybeFieldValue

        maybeFallbackString =
            Maybe.map fieldValueToString maybeFallbackFieldValue

        defaultString =
            Maybe.withDefault "" maybeSpecificString

        fallbackString =
            Maybe.withDefault "" maybeFallbackString

        inputType =
            fieldTypeToInputType fieldLocator.fieldType

        fieldClasses =
            fieldInstanceClasses fieldInstance

        fieldValid =
            validateFieldInstance

        isReadOnly =
            fieldInstance.readOnly || (not enabled)

        parentClasses =
            if isReadOnly then
                [ C.InputContainer, C.ReadOnly ]
            else
                [ C.InputContainer ]

        inputComponent =
            if isReadOnly then
                div [ class [ C.BasicInputReadOnly ] ] [ text fallbackString ]
            else
                input
                    [ onInput (Input fieldLocator)
                    , onFocus (Focus fieldLocator)
                    , onBlur (Blur fieldLocator)
                    , defaultValue defaultString
                    , placeholder fallbackString
                    , class (C.BasicInput :: fieldClasses)
                    , type_ inputType
                    ]
                    []
    in
        div [ class parentClasses ]
            [ inputComponent
            , unitDisplay fiat fieldInstance
            ]


textareaInput : String -> FieldInstance -> Maybe FieldValue -> Maybe FieldValue -> Bool -> Html Msg
textareaInput fiat fieldInstance maybeFieldValue maybeFallbackFieldValue enabled =
    let
        fieldLocator =
            fieldInstance.fieldLocator

        maybeSpecificString =
            Maybe.map fieldValueToString maybeFieldValue

        maybeFallbackString =
            Maybe.map fieldValueToString maybeFallbackFieldValue

        defaultString =
            Maybe.withDefault "" maybeSpecificString

        fallbackString =
            Maybe.withDefault "" maybeFallbackString

        inputType =
            fieldTypeToInputType fieldLocator.fieldType

        fieldClasses =
            fieldInstanceClasses fieldInstance

        fieldValid =
            validateFieldInstance

        isReadOnly =
            fieldInstance.readOnly || (not enabled)

        parentClasses =
            if isReadOnly then
                [ C.InputContainer, C.ReadOnly ]
            else
                [ C.InputContainer ]

        inputComponent =
            textarea
                [ onInput (Input fieldLocator)
                , onFocus (Focus fieldLocator)
                , onBlur (Blur fieldLocator)
                , defaultValue defaultString
                , placeholder fallbackString
                , class (C.Textarea :: fieldClasses)
                , disabled isReadOnly
                ]
                []
    in
        div [ class parentClasses ]
            [ inputComponent
            , unitDisplay fiat fieldInstance
            ]


type alias LocalConfig =
    SelectizeHelper.LocalConfig Msg String DisplayRec


accountSelectizeView :
    ResolvedModel
    -> LocalConfig
    -> FieldInstance
    -> Selectize.State
    -> Maybe FieldValue
    -> Maybe FieldValue
    -> Html Msg
accountSelectizeView model localConfig fieldInstance selectizeState maybeFieldValue maybeFallbackFieldValue =
    let
        specificConfig =
            { maxItems = 1
            , selectedDisplay = .display
            , optionDisplay = .display
            , match = FuzzyMatch.match
            , customCssClass = C.SelectizeAccount
            }

        matchAccount accountRec =
            case fieldInstance.fieldLocator.fieldClass of
                Nothing ->
                    True

                Just fieldClass ->
                    (accountRec.class
                        == fieldClass
                    )
                        && (case accountRec.cryptos of
                                Nothing ->
                                    True

                                Just cryptos ->
                                    List.member model.crypto cryptos
                           )

        availableItems =
            List.filter matchAccount model.configGroup.data.accounts
                |> List.map accountRecToDisplayRec

        selectedIds =
            Maybe.map fieldValueToString maybeFieldValue
                |> maybeToList

        fallbackIds =
            Maybe.map fieldValueToString maybeFallbackFieldValue
                |> maybeToList
    in
        Selectize.view (buildConfig localConfig specificConfig)
            selectedIds
            availableItems
            fallbackIds
            selectizeState


fiatCurrencySelectizeView :
    ResolvedModel
    -> LocalConfig
    -> FieldInstance
    -> Selectize.State
    -> Maybe FieldValue
    -> Maybe FieldValue
    -> Html Msg
fiatCurrencySelectizeView model localConfig fieldInstance selectizeState maybeFieldValue maybeFallbackFieldValue =
    let
        specificConfig =
            { maxItems = 1
            , selectedDisplay = .code
            , optionDisplay = .display
            , match = FuzzyMatch.match
            , customCssClass = C.SelectizeFiatCurrency
            }

        availableItems =
            model.configGroup.data.currencies

        selectedIds =
            Maybe.map fieldValueToString maybeFieldValue
                |> maybeToList

        fallbackIds =
            Maybe.map fieldValueToString maybeFallbackFieldValue
                |> maybeToList
    in
        Selectize.view (buildConfig localConfig specificConfig)
            selectedIds
            availableItems
            fallbackIds
            selectizeState


cryptoCurrencySelectizeView :
    ResolvedModel
    -> LocalConfig
    -> FieldInstance
    -> Selectize.State
    -> Maybe FieldValue
    -> Maybe FieldValue
    -> Html Msg
cryptoCurrencySelectizeView model localConfig fieldInstance selectizeState maybeFieldValue maybeFallbackFieldValue =
    let
        specificConfig =
            { maxItems = 6
            , selectedDisplay = .code
            , optionDisplay = .display
            , match = FuzzyMatch.match
            , customCssClass = C.SelectizeCryptoCurrency
            }

        toDisplay crypto =
            { code = cryptoToString crypto.crypto, display = crypto.display }

        availableItems =
            List.map toDisplay model.configGroup.data.cryptoCurrencies

        toList maybeValue =
            case maybeValue of
                Nothing ->
                    []

                Just fieldValue ->
                    case fieldValue of
                        FieldCryptoCurrencyValue list ->
                            list

                        _ ->
                            Debug.crash "Shouldn't be here"

        selectedIds =
            toList maybeFieldValue

        fallbackIds =
            toList maybeFallbackFieldValue
    in
        Selectize.view (buildConfig localConfig specificConfig)
            selectedIds
            availableItems
            fallbackIds
            selectizeState


languageSelectizeView :
    ResolvedModel
    -> LocalConfig
    -> FieldInstance
    -> Selectize.State
    -> Maybe FieldValue
    -> Maybe FieldValue
    -> Html Msg
languageSelectizeView model localConfig fieldInstance selectizeState maybeFieldValue maybeFallbackFieldValue =
    let
        specificConfig =
            { maxItems = 4
            , selectedDisplay = .code
            , optionDisplay = .display
            , match = FuzzyMatch.match
            , customCssClass = C.SelectizeLanguage
            }

        availableItems =
            model.configGroup.data.languages

        toList maybeValue =
            case maybeValue of
                Nothing ->
                    []

                Just fieldValue ->
                    case fieldValue of
                        FieldLanguageValue list ->
                            list

                        _ ->
                            Debug.crash "Shouldn't be here"

        selectedIds =
            toList maybeFieldValue

        fallbackIds =
            toList maybeFallbackFieldValue
    in
        Selectize.view (buildConfig localConfig specificConfig)
            selectedIds
            availableItems
            fallbackIds
            selectizeState


countrySelectizeView :
    ResolvedModel
    -> LocalConfig
    -> FieldInstance
    -> Selectize.State
    -> Maybe FieldValue
    -> Maybe FieldValue
    -> Html Msg
countrySelectizeView model localConfig fieldInstance selectizeState maybeFieldValue maybeFallbackFieldValue =
    let
        specificConfig =
            { maxItems = 1
            , selectedDisplay = .code
            , optionDisplay = .display
            , match = FuzzyMatch.match
            , customCssClass = C.SelectizeCountry
            }

        availableItems =
            model.configGroup.data.countries

        selectedIds =
            Maybe.map fieldValueToString maybeFieldValue
                |> maybeToList

        fallbackIds =
            Maybe.map fieldValueToString maybeFallbackFieldValue
                |> maybeToList
    in
        Selectize.view (buildConfig localConfig specificConfig)
            selectedIds
            availableItems
            fallbackIds
            selectizeState


selectizeView :
    ResolvedModel
    -> FieldInstance
    -> Selectize.State
    -> Maybe FieldValue
    -> Maybe FieldValue
    -> Bool
    -> Html Msg
selectizeView model fieldInstance selectizeState maybeFieldValue maybeFallbackFieldValue enabled =
    let
        fieldLocator =
            fieldInstance.fieldLocator

        localConfig =
            { toMsg = SelectizeMsg fieldLocator
            , onAdd = Add fieldLocator
            , onRemove = Remove fieldLocator
            , onFocus = FocusSelectize fieldLocator
            , onBlur = BlurSelectize fieldLocator
            , toId = .code
            , enabled = True
            }

        fallbackFieldValue =
            Maybe.withDefault "" (Maybe.map fieldValueToString maybeFallbackFieldValue)
    in
        if fieldInstance.readOnly || (not enabled) then
            div [ class [ C.InputContainer, C.ReadOnly ] ]
                [ div [ class [ C.BasicInputReadOnly ] ] [ text fallbackFieldValue ]
                ]
        else
            case fieldLocator.fieldType of
                FieldAccountType ->
                    accountSelectizeView model
                        localConfig
                        fieldInstance
                        selectizeState
                        maybeFieldValue
                        maybeFallbackFieldValue

                FieldFiatCurrencyType ->
                    fiatCurrencySelectizeView model
                        localConfig
                        fieldInstance
                        selectizeState
                        maybeFieldValue
                        maybeFallbackFieldValue

                FieldCryptoCurrencyType ->
                    cryptoCurrencySelectizeView model
                        localConfig
                        fieldInstance
                        selectizeState
                        maybeFieldValue
                        maybeFallbackFieldValue

                FieldLanguageType ->
                    languageSelectizeView model
                        localConfig
                        fieldInstance
                        selectizeState
                        maybeFieldValue
                        maybeFallbackFieldValue

                FieldCountryType ->
                    countrySelectizeView model
                        localConfig
                        fieldInstance
                        selectizeState
                        maybeFieldValue
                        maybeFallbackFieldValue

                FieldOnOffType ->
                    onOffSelectizeView model
                        localConfig
                        fieldInstance
                        selectizeState
                        maybeFieldValue
                        maybeFallbackFieldValue

                _ ->
                    Debug.crash "Not a Selectize field"


onOffSelectizeView :
    ResolvedModel
    -> LocalConfig
    -> FieldInstance
    -> Selectize.State
    -> Maybe FieldValue
    -> Maybe FieldValue
    -> Html Msg
onOffSelectizeView model localConfig fieldInstance selectizeState maybeFieldValue maybeFallbackFieldValue =
    let
        specificConfig =
            { maxItems = 1
            , selectedDisplay = .display
            , optionDisplay = .display
            , match = FuzzyMatch.match
            , customCssClass = C.SelectizeOnOff
            }

        availableItems =
            [ { display = "On", code = "on" }, { display = "Off", code = "off" } ]

        selectedIds =
            Maybe.map fieldValueToString maybeFieldValue
                |> maybeToList

        fallbackIds =
            Maybe.map fieldValueToString maybeFallbackFieldValue
                |> maybeToList
    in
        Selectize.view (buildConfig localConfig specificConfig)
            selectedIds
            availableItems
            fallbackIds
            selectizeState


isJust : Maybe a -> Bool
isJust maybe =
    case maybe of
        Just a ->
            True

        Nothing ->
            False


fieldInput : ResolvedModel -> FieldInstance -> Maybe FieldValue -> Maybe FieldValue -> Bool -> Html Msg
fieldInput model fieldInstance maybeFieldValue maybeFallbackFieldValue enabled =
    if not enabled && (not <| isJust maybeFallbackFieldValue) then
        div [ class [ C.BasicInputDisabled ] ] []
    else
        case fieldInstance.component of
            InputBoxComponent ->
                textInput model.fiat fieldInstance maybeFieldValue maybeFallbackFieldValue enabled

            TextAreaComponent ->
                textareaInput model.fiat fieldInstance maybeFieldValue maybeFallbackFieldValue enabled

            SelectizeComponent selectizeState ->
                selectizeView model fieldInstance selectizeState maybeFieldValue maybeFallbackFieldValue enabled


referenceFields : FieldScope -> List Field -> List String -> List FieldValue
referenceFields fieldScope fields fieldCodes =
    let
        fallback fieldCode =
            fallbackValue fieldScope fields fieldCode
    in
        List.filterMap fallback fieldCodes


fallbackValue : FieldScope -> List Field -> String -> Maybe FieldValue
fallbackValue fieldScope fields fieldCode =
    let
        pick =
            pickFieldValue fieldCode fields

        maybeGlobal =
            pick GlobalCrypto GlobalMachine

        maybeGlobalCrypto =
            pick GlobalCrypto fieldScope.machine

        maybeGlobalMachine =
            pick fieldScope.crypto GlobalMachine

        maybeSpecific =
            pick fieldScope.crypto fieldScope.machine
    in
        List.filterMap identity [ maybeSpecific, maybeGlobalMachine, maybeGlobalCrypto, maybeGlobal ]
            |> List.head


fieldToFieldMeta : Field -> FieldMeta
fieldToFieldMeta field =
    { fieldLocator = field.fieldLocator
    , fieldEnabledIfAny = field.fieldEnabledIfAny
    , fieldEnabledIfAll = field.fieldEnabledIfAll
    , inScope = field.inScope
    }


fieldInstanceToFieldMeta : FieldInstance -> FieldMeta
fieldInstanceToFieldMeta fieldInstance =
    { fieldLocator = fieldInstance.fieldLocator
    , fieldEnabledIfAny = fieldInstance.fieldEnabledIfAny
    , fieldEnabledIfAll = fieldInstance.fieldEnabledIfAll
    , inScope = fieldInstance.inScope
    }


fieldInstanceToField : FieldInstance -> Maybe Field
fieldInstanceToField fieldInstance =
    let
        maybeFieldValue =
            fieldHolderToMaybe fieldInstance.fieldHolder

        buildFieldInstance fieldValue =
            { fieldLocator = fieldInstance.fieldLocator
            , fieldValue = fieldValue
            , fieldEnabledIfAny = fieldInstance.fieldEnabledIfAny
            , fieldEnabledIfAll = fieldInstance.fieldEnabledIfAll
            , inScope = fieldInstance.inScope
            }
    in
        Maybe.map buildFieldInstance maybeFieldValue


checkEnabled : List Field -> FieldMeta -> Bool
checkEnabled fields fieldMeta =
    if not fieldMeta.inScope then
        False
    else
        let
            enabledIfAnyInstances =
                referenceFields fieldMeta.fieldLocator.fieldScope fields fieldMeta.fieldEnabledIfAny

            enabledIfAllInstances =
                referenceFields fieldMeta.fieldLocator.fieldScope fields fieldMeta.fieldEnabledIfAll

            enabledIfAny =
                (List.isEmpty fieldMeta.fieldEnabledIfAny) || (List.any isField enabledIfAnyInstances)

            enabledIfAll =
                (List.isEmpty fieldMeta.fieldEnabledIfAll) || (List.all isField enabledIfAllInstances)
        in
            enabledIfAny && enabledIfAll


fieldComponent : ResolvedModel -> FieldInstance -> Html Msg
fieldComponent model fieldInstance =
    let
        fieldLocator =
            fieldInstance.fieldLocator

        fieldScope =
            fieldLocator.fieldScope

        fieldCode =
            fieldLocator.code

        fieldClass =
            fieldLocator.fieldClass

        fieldInstances : List FieldInstance
        fieldInstances =
            model.fieldCollection.fieldInstances

        fieldType =
            fieldLocator.fieldType

        maybeSpecific =
            case fieldInstance.fieldHolder of
                FieldOk fieldValue ->
                    Just fieldValue

                _ ->
                    Nothing

        allFields =
            buildAllFields model.fieldCollection

        maybeFallbackFieldValue =
            fallbackValue fieldScope allFields fieldCode

        enabled =
            checkEnabled allFields (fieldInstanceToFieldMeta fieldInstance)

        focused =
            (Just fieldLocator) == model.focused

        fieldValid =
            validateFieldInstance model.fieldCollection fieldInstance

        fieldLengthClasses =
            List.map (\class -> ( class, True )) (fieldInstanceClasses fieldInstance)
    in
        div
            [ classList
                ([ ( C.Component, True )
                 , ( C.FocusedComponent, focused )
                 , ( C.InvalidComponent, not fieldValid )
                 ]
                    ++ fieldLengthClasses
                )
            ]
            [ fieldInput model fieldInstance maybeSpecific maybeFallbackFieldValue enabled ]

textareaComponent : ResolvedModel -> FieldInstance -> Html Msg
textareaComponent model fieldInstance =
    let
        fieldLocator =
            fieldInstance.fieldLocator

        fieldScope =
            fieldLocator.fieldScope

        fieldCode =
            fieldLocator.code

        fieldClass =
            fieldLocator.fieldClass

        fieldInstances : List FieldInstance
        fieldInstances =
            model.fieldCollection.fieldInstances

        fieldType =
            fieldLocator.fieldType

        maybeSpecific =
            case fieldInstance.fieldHolder of
                FieldOk fieldValue ->
                    Just fieldValue

                _ ->
                    Nothing

        allFields =
            buildAllFields model.fieldCollection

        maybeFallbackFieldValue =
            fallbackValue fieldScope allFields fieldCode

        enabled =
            checkEnabled allFields (fieldInstanceToFieldMeta fieldInstance)

        focused =
            (Just fieldLocator) == model.focused

        fieldValid =
            validateFieldInstance model.fieldCollection fieldInstance

        fieldLengthClasses =
            List.map (\class -> ( class, True )) (fieldInstanceClasses fieldInstance)
    in
        div
            [ classList
                ([ ( C.Component, True )
                 , ( C.FocusedComponent, focused )
                 , ( C.InvalidComponent, not fieldValid )
                 ]
                    ++ fieldLengthClasses
                )
            ]
            [ fieldInput model fieldInstance maybeSpecific maybeFallbackFieldValue enabled ]


cellView : ResolvedModel -> FieldInstance -> Html Msg
cellView model fieldInstance =
    -- Note: keying here is needed to clear out fields when switching cryptos
    let
        fieldLocator =
            fieldInstance.fieldLocator

        fieldScope =
            fieldLocator.fieldScope

        machine =
            fieldScope.machine

        crypto =
            fieldScope.crypto
    in
        Html.Keyed.node "td"
            []
            [ ( (cryptoToString crypto)
                    ++ "-"
                    ++ (machineToString machine)
                    ++ "-"
                    ++ fieldLocator.code
              , fieldComponent model fieldInstance
              )
            ]


rowView : ResolvedModel -> List FieldInstance -> Bool -> MachineDisplay -> Html Msg
rowView model fieldInstances displayMachineName machineDisplay =
    let
        machine =
            machineDisplay.machine

        globalRowClass =
            case machine of
                GlobalMachine ->
                    class [ C.ConfigTableGlobalRow ]

                _ ->
                    class []

        fieldScope =
            { crypto = model.crypto
            , machine = machineDisplay.machine
            }

        toFieldLocator entry =
            { fieldScope = fieldScope
            , code = entry.code
            }

        machineScoped fieldInstance =
            fieldInstance.fieldLocator.fieldScope.machine == machine

        filteredFieldInstances : List FieldInstance
        filteredFieldInstances =
            List.filter machineScoped fieldInstances
    in
        if displayMachineName then
            tr [ globalRowClass ]
                ((td [ class [ C.ShortCell ] ] [ text (machineDisplay.display) ])
                    :: (List.map (cellView model)
                            filteredFieldInstances
                       )
                )
        else
            tr [ globalRowClass ] (List.map (cellView model) filteredFieldInstances)


topHeaderRowView : ConfigGroup -> Crypto -> Bool -> Html Msg
topHeaderRowView configGroup crypto displayMachineName =
    let
        headerCellView fieldDescriptor =
            case fieldDescriptor.displayTop of
                DisplayTopLeader cols display ->
                    Just <| th [ colspan cols, class [ C.MultiDisplay ] ] [ text display ]

                DisplayTopSolo display ->
                    Just <| th [] [ text display ]

                DisplayTopNone ->
                    Nothing

        cells =
            if displayMachineName then
                ((th [] []) :: List.filterMap headerCellView configGroup.schema.entries)
            else
                List.filterMap headerCellView configGroup.schema.entries
    in
        tr [ class [ C.TopDisplay ] ] cells


bottomHeaderRowView : ConfigGroup -> Crypto -> Bool -> Html Msg
bottomHeaderRowView configGroup crypto displayMachineName =
    let
        headerCellView fieldDescriptor =
            th [] [ text fieldDescriptor.displayBottom ]

        cells =
            if displayMachineName then
                ((th [] []) :: List.map headerCellView configGroup.schema.entries)
            else
                List.map headerCellView configGroup.schema.entries
    in
        tr [] cells


complianceTableView : ResolvedModel -> Html Msg
complianceTableView model =
    let
        cryptoScoped fieldInstance =
            fieldInstance.fieldLocator.fieldScope.crypto == model.crypto

        instances : List FieldInstance
        instances =
            List.filter cryptoScoped model.fieldCollection.fieldInstances

        pickField code =
            pickFieldInstance code { crypto = GlobalCrypto, machine = GlobalMachine } instances

        emptyCell =
            td [] [ text "--" ]

        fieldCodeCellView code =
            Maybe.Extra.unwrap emptyCell (cellView model) (pickField code)

        header =
            tr []
                [ th [] []
                , th [] [ text "Active" ]
                , th [] [ text "Threshold" ]
                ]

        row label activeFieldCode thresholdFieldCode =
            tr []
                ((td [ class [ C.ShortCell ] ] [ text label ])
                    :: [ fieldCodeCellView activeFieldCode
                       , fieldCodeCellView thresholdFieldCode
                       ]
                )
    in
        table [ class [ C.ConfigTable ] ]
            [ tbody []
                [ header
                , row "SMS" "smsVerificationActive" "smsVerificationThreshold"
                , row "ID Card Data" "idCardDataVerificationActive" "idCardDataVerificationThreshold"
                , row "ID Card Photo" "idCardPhotoVerificationActive" "idCardPhotoVerificationThreshold"
                , row "Front Facing Camera" "frontCameraVerificationActive" "frontCameraVerificationThreshold"
                , row "Sanctions" "sanctionsVerificationActive" "sanctionsVerificationThreshold"
                , row "Cross Reference" "crossRefVerificationActive" "crossRefVerificationThreshold"
                , row "Hard Limit" "hardLimitVerificationActive" "hardLimitVerificationThreshold"
                ]
            ]

termsTableView : ResolvedModel -> Html Msg
termsTableView model =
    let
        cryptoScoped fieldInstance =
            fieldInstance.fieldLocator.fieldScope.crypto == model.crypto

        instances : List FieldInstance
        instances =
            List.filter cryptoScoped model.fieldCollection.fieldInstances

        pickField code =
            pickFieldInstance code { crypto = GlobalCrypto, machine = GlobalMachine } instances

        emptyCell =
            td [] [ text "--" ]

        fieldCodeCellView code =
            Maybe.Extra.unwrap emptyCell (cellView model) (pickField code)

        row label activeFieldCode =
            tr []
                ((td [ class [ C.ShortCell ] ] [ text label ])
                    :: [ fieldCodeCellView activeFieldCode ]
                )
    in
        table [ class [ C.ConfigTable ] ]
            [ tbody []
                [ row "Show on screen" "termsScreenActive"
                , row "Screen title" "termsScreenTitle"
                , row "Text content" "termsScreenText"
                , row "Accept button text" "termsAcceptButtonText"
                , row "Cancel button text" "termsCancelButtonText"
                ]
            ]

tableView : ResolvedModel -> Html Msg
tableView model =
    let
        configGroup =
            model.configGroup

        crypto =
            model.crypto

        displayMachineName =
            configGroup.schema.code /= "definition"

        topHeaderRow =
            topHeaderRowView configGroup crypto displayMachineName

        bottomHeaderRow =
            bottomHeaderRowView configGroup crypto displayMachineName

        machines =
            listMachines configGroup

        cryptoScoped fieldInstance =
            fieldInstance.fieldLocator.fieldScope.crypto == crypto

        instances : List FieldInstance
        instances =
            List.filter cryptoScoped model.fieldCollection.fieldInstances

        rows =
            List.map (rowView model instances displayMachineName) machines
    in
        table [ class [ C.ConfigTable ] ]
            [ thead [] [ topHeaderRow, bottomHeaderRow ]
            , tbody [] rows
            ]


isField : FieldValue -> Bool
isField fieldValue =
    case fieldValue of
        FieldOnOffValue bool ->
            bool

        _ ->
            Debug.crash "Referenced field must be boolean"


type Msg
    = Load WebConfigGroup
    | Submit
    | Input FieldLocator String
    | CryptoSwitch Crypto
    | SelectizeMsg FieldLocator Selectize.State
    | Blur FieldLocator
    | Focus FieldLocator
    | BlurSelectize FieldLocator Selectize.State
    | FocusSelectize FieldLocator Selectize.State
    | Add FieldLocator String Selectize.State
    | Remove FieldLocator Selectize.State
    | HideSaveIndication
    | NoOp


maybeToList : Maybe a -> List a
maybeToList maybe =
    case maybe of
        Nothing ->
            []

        Just x ->
            [ x ]


buildFieldComponent : ConfigGroup -> FieldType -> FieldScope -> Maybe FieldValue -> FieldComponent
buildFieldComponent configGroup fieldType fieldScope fieldValue =
    case fieldType of
        FieldStringType ->
            InputBoxComponent

        FieldPercentageType ->
            InputBoxComponent

        FieldIntegerType ->
            InputBoxComponent

        FieldDecimalType ->
            InputBoxComponent

        FieldOnOffType ->
            SelectizeComponent Selectize.initialSelectize

        FieldAccountType ->
            SelectizeComponent Selectize.initialSelectize

        FieldFiatCurrencyType ->
            SelectizeComponent Selectize.initialSelectize

        FieldCryptoCurrencyType ->
            SelectizeComponent Selectize.initialSelectize

        FieldLanguageType ->
            SelectizeComponent Selectize.initialSelectize

        FieldCountryType ->
            SelectizeComponent Selectize.initialSelectize

        FieldTextAreaType ->
            TextAreaComponent

        FieldMarkdownType ->
            TextAreaComponent


isInScope : ConfigScope -> ConfigScope -> FieldScope -> Bool
isInScope cryptoScope machineScope fieldScope =
    not
        ((cryptoScope == Specific && fieldScope.crypto == GlobalCrypto)
            || (machineScope == Specific && fieldScope.machine == GlobalMachine)
            || (cryptoScope == Global && fieldScope.crypto /= GlobalCrypto)
            || (machineScope == Global && fieldScope.machine /= GlobalMachine)
        )


initFieldInstance : ConfigGroup -> FieldDescriptor -> FieldScope -> FieldInstance
initFieldInstance configGroup fieldDescriptor fieldScope =
    let
        fieldLocator : FieldLocator
        fieldLocator =
            { fieldScope = fieldScope
            , code = fieldDescriptor.code
            , fieldType = fieldDescriptor.fieldType
            , fieldClass = fieldDescriptor.fieldClass
            }

        equivalentFieldLocator a b =
            a.fieldScope
                == b.fieldScope
                && a.code
                == b.code

        inScope =
            isInScope fieldDescriptor.cryptoScope fieldDescriptor.machineScope fieldScope

        maybeValue =
            List.filter ((equivalentFieldLocator fieldLocator) << .fieldLocator) configGroup.values
                |> List.head
                |> Maybe.map .fieldValue

        component =
            buildFieldComponent configGroup fieldDescriptor.fieldType fieldScope maybeValue

        maybeToFieldHolder maybe =
            Maybe.map FieldOk maybe
                |> Maybe.withDefault FieldEmpty

        fieldHolder =
            maybeToFieldHolder maybeValue

        readOnly =
            if fieldLocator.code == "cashOutEnabled" && fieldScope.machine == GlobalMachine then
                True
            else
                fieldDescriptor.readOnly
    in
        { fieldLocator = fieldLocator
        , component = component
        , fieldHolder = fieldHolder
        , loadedFieldHolder = fieldHolder
        , fieldValidation = fieldDescriptor.fieldValidation
        , fieldEnabledIfAny = fieldDescriptor.fieldEnabledIfAny
        , fieldEnabledIfAll = fieldDescriptor.fieldEnabledIfAll
        , readOnly = readOnly
        , inScope = inScope
        }


validateRequired : List Field -> FieldInstance -> Bool
validateRequired fields fieldInstance =
    let
        fieldScope =
            fieldInstance.fieldLocator.fieldScope

        fieldCode =
            fieldInstance.fieldLocator.code

        maybeFallbackFieldValue =
            fallbackValue fieldScope fields fieldCode

        maybeFallbackString =
            Maybe.map fieldValueToString maybeFallbackFieldValue

        isEmpty =
            Maybe.map String.isEmpty maybeFallbackString
                |> Maybe.withDefault True
    in
        not isEmpty


validateMin : Int -> FieldValue -> Bool
validateMin min fieldValue =
    case fieldValue of
        FieldPercentageValue v ->
            (ceiling v) >= min

        FieldIntegerValue v ->
            v >= min

        _ ->
            True


validateMax : Int -> FieldValue -> Bool
validateMax max fieldValue =
    case fieldValue of
        FieldPercentageValue v ->
            (floor v) <= max

        FieldIntegerValue v ->
            v <= max

        _ ->
            True


validate : List Field -> FieldInstance -> FieldValidator -> Bool
validate fields fieldInstance fieldValidator =
    case fieldValidator of
        FieldRequired ->
            validateRequired fields fieldInstance

        FieldMin min ->
            fieldHolderMap True (validateMin min) fieldInstance.fieldHolder

        FieldMax max ->
            fieldHolderMap True (validateMax max) fieldInstance.fieldHolder


buildAllFields : FieldCollection -> List Field
buildAllFields fieldCollection =
    List.filterMap fieldInstanceToField fieldCollection.fieldInstances
        ++ fieldCollection.fields


validateFieldInstance : FieldCollection -> FieldInstance -> Bool
validateFieldInstance fieldCollection fieldInstance =
    let
        allFields =
            buildAllFields fieldCollection

        enabled =
            checkEnabled allFields (fieldInstanceToFieldMeta fieldInstance)
    in
        not enabled || List.all (validate allFields fieldInstance) fieldInstance.fieldValidation


initFieldInstancesPerEntry : ConfigGroup -> FieldDescriptor -> List FieldInstance
initFieldInstancesPerEntry configGroup fieldDescriptor =
    List.map (initFieldInstance configGroup fieldDescriptor) (fieldScopes configGroup)


initFieldInstances : ConfigGroup -> List FieldInstance
initFieldInstances configGroup =
    List.concatMap (initFieldInstancesPerEntry configGroup) configGroup.schema.entries


buildFieldCollection : ConfigGroup -> FieldCollection
buildFieldCollection configGroup =
    { fields = configGroup.values
    , fieldInstances = initFieldInstances configGroup
    }


pickFieldInstance : String -> FieldScope -> List FieldInstance -> Maybe FieldInstance
pickFieldInstance fieldCode fieldScope fieldInstances =
    let
        sameScope fieldInstance =
            fieldInstance.fieldLocator.code
                == fieldCode
                && fieldInstance.fieldLocator.fieldScope
                == fieldScope
    in
        List.filter sameScope fieldInstances
            |> List.head


fieldInstanceToMaybeFieldValue : FieldInstance -> Maybe FieldValue
fieldInstanceToMaybeFieldValue fieldInstance =
    case fieldInstance.fieldHolder of
        FieldOk fieldValue ->
            Just fieldValue

        _ ->
            Nothing


pickFieldValue : String -> List Field -> Crypto -> Machine -> Maybe FieldValue
pickFieldValue fieldCode fields crypto machine =
    let
        fieldScope =
            { crypto = crypto, machine = machine }

        sameScope field =
            field.fieldLocator.code
                == fieldCode
                && field.fieldLocator.fieldScope
                == fieldScope
    in
        List.filter sameScope fields |> List.head |> Maybe.map .fieldValue


updateFocus : FieldLocator -> Bool -> Model -> Model
updateFocus fieldLocator focused model =
    if focused then
        { model | focused = Just fieldLocator }
    else if model.focused == Just fieldLocator then
        { model | focused = Nothing }
    else
        model


isCashOutEnabled : FieldInstance -> Bool
isCashOutEnabled fieldInstance =
    let
        toBool fieldValue =
            case fieldValue of
                FieldOnOffValue v ->
                    v

                _ ->
                    False
    in
        fieldInstance.fieldLocator.code
            == "cashOutEnabled"
            && fieldInstance.fieldLocator.fieldScope.machine
            /= GlobalMachine
            && fieldHolderMap False toBool fieldInstance.fieldHolder


selectizeEdgeCases : FieldInstance -> List FieldInstance -> FieldInstance
selectizeEdgeCases fieldInstance fieldInstances =
    if
        (fieldInstance.fieldLocator.code
            == "cashOutEnabled"
            && fieldInstance.fieldLocator.fieldScope.machine
            == GlobalMachine
        )
    then
        { fieldInstance
            | fieldHolder =
                FieldOk <|
                    FieldOnOffValue <|
                        List.any isCashOutEnabled fieldInstances
        }
    else
        fieldInstance


updateSelectize : FieldLocator -> Selectize.State -> Model -> Model
updateSelectize fieldLocator state model =
    let
        fieldInstances =
            model.fieldCollection.fieldInstances

        updateInstance fieldInstance =
            if (fieldInstance.fieldLocator == fieldLocator) then
                case fieldInstance.component of
                    SelectizeComponent _ ->
                        { fieldInstance | component = SelectizeComponent state }

                    _ ->
                        Debug.crash "Shouldn't be here"
            else
                selectizeEdgeCases fieldInstance fieldInstances

        fieldCollection =
            model.fieldCollection

        newFieldCollection =
            { fieldCollection | fieldInstances = List.map updateInstance fieldInstances }
    in
        { model | fieldCollection = newFieldCollection }


pickFiat : List Field -> Maybe String
pickFiat fields =
    List.filter (((==) "fiatCurrency") << .code << .fieldLocator) fields
        |> List.head
        |> Maybe.map (fieldValueToString << .fieldValue)


updateRates : List StatusTypes.Rate -> Model -> Model
updateRates rates model =
    { model | rates = rates }


submit : Model -> ( Model, Cmd Msg )
submit model =
    case model.webConfigGroup of
        Success configGroup ->
            { model | status = Saving }
                ! [ postForm configGroup.schema.code model.fieldCollection.fieldInstances ]

        _ ->
            model ! []


submitNoLoad : Model -> ( Model, Cmd Msg )
submitNoLoad model =
    case model.webConfigGroup of
        Success configGroup ->
            model
                ! [ postFormNoLoad configGroup.schema.code model.fieldCollection.fieldInstances ]

        _ ->
            model ! []


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Load webConfigGroup ->
            let
                status =
                    if model.status == Saving then
                        Saved
                    else
                        model.status

                fieldCollection : FieldCollection
                fieldCollection =
                    case webConfigGroup of
                        Success configGroup ->
                            buildFieldCollection configGroup

                        _ ->
                            initFieldCollection

                fiat =
                    case webConfigGroup of
                        Success configGroup ->
                            pickFiat configGroup.values

                        _ ->
                            Nothing

                defaultCrypto =
                    case webConfigGroup of
                        Success configGroup ->
                            (allCryptos configGroup.data.cryptoCurrencies
                                configGroup.schema.cryptoScope
                                configGroup.selectedCryptos
                            )
                                |> List.head
                                |> Maybe.map .crypto

                        _ ->
                            Nothing

                crypto =
                    case model.crypto of
                        Nothing ->
                            defaultCrypto

                        Just crypto ->
                            Just crypto

                cmd =
                    if status == Saved then
                        Process.sleep (2 * second)
                            |> Task.perform (\_ -> HideSaveIndication)
                    else
                        Cmd.none
            in
                ( { model
                    | webConfigGroup = webConfigGroup
                    , fieldCollection = fieldCollection
                    , status = status
                    , crypto = crypto
                    , fiat = fiat
                  }
                , cmd
                )

        Submit ->
            submit model

        Input fieldLocator valueString ->
            updateInput fieldLocator (Just valueString) model ! []

        CryptoSwitch crypto ->
            case model.webConfigGroup of
                Success configGroup ->
                    let
                        cryptoCode =
                            cryptoToString crypto

                        path =
                            "#config/" ++ configGroup.schema.code ++ "/" ++ cryptoCode

                        command =
                            Navigation.newUrl path
                    in
                        { model | crypto = Just crypto } ! [ command ]

                _ ->
                    model ! []

        Focus fieldLocator ->
            updateFocus fieldLocator True model ! []

        Blur fieldLocator ->
            updateFocus fieldLocator False model ! []

        SelectizeMsg fieldLocator selectizeState ->
            updateSelectize fieldLocator selectizeState model ! []

        BlurSelectize fieldLocator selectizeState ->
            (updateSelectize fieldLocator selectizeState model
                |> updateFocus fieldLocator False
            )
                ! []

        FocusSelectize fieldLocator selectizeState ->
            (updateSelectize fieldLocator selectizeState model
                |> updateFocus fieldLocator True
            )
                ! []

        Add fieldLocator code selectizeState ->
            (updateSelectize fieldLocator selectizeState model
                |> updateInput fieldLocator (Just code)
            )
                ! []

        Remove fieldLocator selectizeState ->
            (updateSelectize fieldLocator selectizeState model
                |> updateInput fieldLocator Nothing
            )
                ! []

        HideSaveIndication ->
            { model | status = NotSaving } ! []

        NoOp ->
            model ! []


cryptoView : Maybe Crypto -> CryptoDisplay -> Html Msg
cryptoView maybeActiveCrypto cryptoDisplay =
    let
        activeClass =
            case maybeActiveCrypto of
                Nothing ->
                    class []

                Just activeCrypto ->
                    if (activeCrypto == cryptoDisplay.crypto) then
                        class [ C.Active ]
                    else
                        class []
    in
        div [ activeClass, class [ C.CryptoTab ], onClick (CryptoSwitch cryptoDisplay.crypto) ]
            [ text cryptoDisplay.display ]


cryptosView : List CryptoDisplay -> Maybe Crypto -> Html Msg
cryptosView cryptos activeCrypto =
    nav [ class [ C.CryptoTabs ] ] (List.map (cryptoView activeCrypto) cryptos)


view : Model -> Html Msg
view model =
    case model.webConfigGroup of
        NotAsked ->
            div [] []

        Loading ->
            div [] [ text "Loading..." ]

        Failure err ->
            div [] [ text (toString err) ]

        Success configGroup ->
            let
                resolvedModel =
                    toResolvedModel model configGroup

                getView =
                    if configGroup.schema.code == "compliance" then
                        complianceTableView
                    else if configGroup.schema.code == "terms" then
                        termsTableView
                    else
                        tableView

                configGroupView =
                    div [ class [ C.ConfigContainer ] ]
                        [ getView resolvedModel ]

                cryptos =
                    allCryptos configGroup.data.cryptoCurrencies
                        configGroup.schema.cryptoScope
                        configGroup.selectedCryptos

                statusString =
                    case model.status of
                        Saved ->
                            "Saved"

                        _ ->
                            ""

                machines =
                    listMachines resolvedModel.configGroup

                fieldInstances =
                    resolvedModel.fieldCollection.fieldInstances

                cryptoFieldInstances =
                    List.filter (\fi -> fi.fieldLocator.fieldScope.crypto == resolvedModel.crypto)
                        fieldInstances

                submitButton =
                    if List.all (validateFieldInstance model.fieldCollection) cryptoFieldInstances then
                        div [ onClick Submit, class [ C.Button ] ] [ text "Submit" ]
                    else
                        div [ class [ C.Button, C.Disabled ] ] [ text "Submit" ]

                form =
                    if List.isEmpty machines then
                        div [ class [ C.EmptyTable ] ] [ text "No paired machines." ]
                    else
                        Html.form []
                            [ div [] [ configGroupView ]
                            , div [ class [ C.ButtonRow ] ]
                                [ submitButton
                                , div [] [ text statusString ]
                                ]
                            ]
            in
                if (configGroup.schema.cryptoScope == Global) then
                    div []
                        [ div [ class [ C.SectionLabel ] ] [ text configGroup.schema.display ]
                        , form
                        ]
                else if List.isEmpty cryptos then
                    div []
                        [ div [ class [ C.SectionLabel ] ] [ text configGroup.schema.display ]
                        , div [] [ text "No Crypto currencies have been set. You can set them under Machine settings." ]
                        ]
                else
                    div []
                        [ div [ class [ C.SectionLabel ] ] [ text configGroup.schema.display ]
                        , div [] [ (cryptosView cryptos model.crypto) ]
                        , form
                        ]


loaded : Msg -> Bool
loaded msg =
    case msg of
        Load webConfigGroup ->
            RemoteData.isSuccess webConfigGroup

        _ ->
            False
