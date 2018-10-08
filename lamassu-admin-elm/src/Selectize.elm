module Selectize
    exposing
        ( initialSelectize
        , view
        , State
        , Config
        , HtmlOptions
        , HtmlClasses
        )

import Html exposing (..)
import Html.Attributes exposing (value, defaultValue, maxlength, class, classList, id, disabled)
import Html.Events as E exposing (on, onWithOptions)
import String
import Json.Decode as Json
import Css.Classes exposing (CssClasses)
import Css.Admin exposing (className)

-- MODEL

type alias HtmlOptions =
    { instructionsForBlank : String
    , noMatches : String
    , typeForMore : String
    , atMaxLength : String
    , noOptions : String
    , notAvailable : String
    , classes : HtmlClasses
    , customCssClass : CssClasses
    }


type alias HtmlClasses =
    { container : String
    , noOptions : String
    , singleItemContainer : String
    , multiItemContainer : String
    , selectBox : String
    , selectedItems : String
    , fallbackItems : String
    , fallbackItem : String
    , selectedItem : String
    , boxContainer : String
    , boxItems : String
    , boxItem : String
    , boxItemActive : String
    , info : String
    , infoNoMatches : String
    , inputEditing : String
    }


type alias H =
    HtmlOptions


type Status
    = Initial
    | Editing
    | Cleared
    | Idle
    | Blurred


type alias State =
    { boxPosition : Int
    , status : Status
    , string : String
    }


type alias Config msg idType itemType =
    { maxItems : Int
    , boxLength : Int
    , toMsg : State -> msg
    , onAdd : idType -> State -> msg
    , onRemove : State -> msg
    , onFocus : State -> msg
    , onBlur : State -> msg
    , toId : itemType -> idType
    , enabled : Bool
    , selectedDisplay : itemType -> String
    , optionDisplay : itemType -> String
    , match : String -> List itemType -> List itemType
    , htmlOptions : HtmlOptions
    }


type alias Items itemType =
    { selectedItems : List itemType
    , availableItems : List itemType
    , boxItems : List itemType
    }


initialSelectize : State
initialSelectize =
    { boxPosition = -1, string = "", status = Blurred }



-- UPDATE


clean : String -> String
clean s =
    String.trim s
        |> String.toLower


updateKeyUp : Config msg idType itemType -> Items itemType -> State -> Int -> msg
updateKeyUp config items state keyCode =
    if keyCode == 13 || keyCode == 9 then
        config.toMsg { state | status = Initial }
    else
        config.toMsg state


addSelection : Config msg idType itemType -> Items itemType -> State -> msg
addSelection config items state =
    let
        maybeItem =
            if state.boxPosition < 0 then
                Nothing
            else
                (List.head << (List.drop state.boxPosition)) items.boxItems
    in
        case maybeItem of
            Nothing ->
                config.toMsg state

            Just item ->
                config.onAdd (config.toId item) { state | status = Cleared, string = "", boxPosition = -1 }


updateKeyDown : Config msg idType itemType -> Items itemType -> State -> Int -> msg
updateKeyDown config items state keyCode =
    if config.maxItems > 1 && List.length items.selectedItems == config.maxItems then
        case keyCode of
            -- backspace
            8 ->
                if String.isEmpty state.string && (not << List.isEmpty) items.selectedItems then
                    config.onRemove state
                else
                    config.toMsg state

            _ ->
                config.toMsg state
    else
        case keyCode of
            -- up
            38 ->
                config.toMsg { state | boxPosition = (max -1 (state.boxPosition - 1)) }

            -- down
            40 ->
                config.toMsg
                    { state
                        | boxPosition =
                            (min ((List.length items.boxItems) - 1)
                                (state.boxPosition + 1)
                            )
                    }

            -- enter
            13 ->
                addSelection config items state

            -- backspace
            8 ->
                if String.isEmpty state.string && (not << List.isEmpty) items.selectedItems then
                    config.onRemove state
                else
                    config.toMsg state

            -- tab
            9 ->
                addSelection config items state

            _ ->
                config.toMsg state



-- VIEW


itemView : Config msg idType itemType -> Bool -> itemType -> Html msg
itemView config isFallback item =
    let
        c =
            config.htmlOptions.classes
    in
        span
            [ classList
                [ ( c.selectedItem, True )
                , ( c.fallbackItem, isFallback )
                ]
            ]
            [ text (config.selectedDisplay item) ]


fallbackItemsView : Config msg idType itemType -> Items itemType -> List itemType -> State -> Html msg
fallbackItemsView config items fallbackItems state =
    let
        c =
            config.htmlOptions.classes

        selectedItems =
            items.selectedItems

        isFallback =
            List.length selectedItems == 0

        classes =
            classList
                [ ( c.selectedItems, True )
                , ( c.fallbackItems, isFallback )
                ]

        itemsView =
            if isFallback then
                fallbackItems
            else
                items.selectedItems
    in
        span [ classes ] (List.map (itemView config isFallback) itemsView)


itemsView : Config msg idType itemType -> Items itemType -> List itemType -> State -> Html msg
itemsView config items fallbackItems state =
    case state.status of
        Editing ->
            fallbackItemsView config items [] state

        Initial ->
            fallbackItemsView config items [] state

        Idle ->
            fallbackItemsView config items [] state

        Cleared ->
            fallbackItemsView config items fallbackItems state

        Blurred ->
            fallbackItemsView config items fallbackItems state


editingBoxView : Config msg idType itemType -> Items itemType -> State -> Html msg
editingBoxView config items state =
    let
        h =
            config.htmlOptions

        c =
            h.classes

        boxItemHtml pos item =
            div
                [ classList
                    [ ( c.boxItem, True )
                    , ( c.boxItemActive, state.boxPosition == pos )
                    ]
                , onMouseDown config state (config.toId item)
                ]
                [ text (config.optionDisplay item)
                ]
    in
        div [ class c.boxItems ] (List.indexedMap boxItemHtml items.boxItems)


idleBoxView : Config msg idType itemType -> Items itemType -> State -> Html msg
idleBoxView config items state =
    let
        h =
            config.htmlOptions

        numSelected =
            List.length items.selectedItems

        remainingItems =
            List.length items.availableItems - numSelected

        typeForMore =
            if remainingItems > config.boxLength then
                if numSelected < config.maxItems then
                    div [ class h.classes.info ] [ text h.typeForMore ]
                else
                    div [ class h.classes.info ] [ text "Backspace for more" ]
            else
                span [] []
    in
        if config.maxItems > 1 && List.length items.selectedItems == config.maxItems then
            span [] []
        else
            div [ class h.classes.boxContainer ]
                [ editingBoxView config items state
                , typeForMore
                ]


noMatches : Config msg idType itemType -> List itemType -> State -> Html msg
noMatches config boxItems state =
    let
        h =
            config.htmlOptions
    in
        if List.length boxItems == 0 then
            div
                [ classList
                    [ ( h.classes.info, True )
                    , ( h.classes.infoNoMatches, True )
                    ]
                ]
                [ text h.noMatches ]
        else
            span [] []


boxView : Config msg idType itemType -> Items itemType -> State -> Html msg
boxView config items state =
    let
        h =
            config.htmlOptions
    in
        case state.status of
            Editing ->
                div [ class h.classes.boxContainer ]
                    [ editingBoxView config items state
                    , noMatches config items.boxItems state
                    ]

            Initial ->
                idleBoxView config items state

            Idle ->
                idleBoxView config items state

            Cleared ->
                idleBoxView config items state

            Blurred ->
                span [] []


buildItems : List itemType -> List itemType -> List itemType -> Items itemType
buildItems selectedItems availableItems boxItems =
    { selectedItems = selectedItems
    , availableItems = availableItems
    , boxItems = boxItems
    }


diffItems : Config msg idType itemType -> List itemType -> List itemType -> List itemType
diffItems config a b =
    let
        isEqual itemA itemB =
            config.toId itemA == config.toId itemB

        notInB b item =
            (List.any (isEqual item) b)
                |> not
    in
        List.filter (notInB b) a


mapToItem : (itemType -> idType) -> List itemType -> idType -> Maybe itemType
mapToItem toId available id =
    List.filter (((==) id) << toId) available
        |> List.head


view : Config msg idType itemType -> List idType -> List itemType -> List idType -> State -> Html msg
view config selectedIds availableItems fallbackIds state =
    if List.length availableItems == 0 then
        div [ class config.htmlOptions.classes.container ]
            [ div [ class config.htmlOptions.classes.noOptions ] [ text config.htmlOptions.noOptions ] ]
    else if not config.enabled then
        div [ class config.htmlOptions.classes.container ]
            [ div [ class config.htmlOptions.classes.noOptions ] [ text "\x2008" ] ]
    else
        let
            h =
                config.htmlOptions

            selectedItems =
                List.filterMap (mapToItem config.toId availableItems) selectedIds

            fallbackItems =
                List.filterMap (mapToItem config.toId availableItems) fallbackIds

            remainingItems =
                diffItems config availableItems selectedItems

            boxItems =
                config.match state.string remainingItems
                    |> List.take 5

            items =
                buildItems selectedItems availableItems boxItems

            onInputAtt =
                onInput config state

            onBlurAtt =
                onBlur config state

            onFocusAtt =
                onFocus config state

            keyDown =
                if config.maxItems > 1 then
                    if String.isEmpty state.string then
                        onKeyDownNoDelete config items state
                    else
                        onKeyDownDelete config items state
                else
                    onKeyDown config items state

            editInput =
                case state.status of
                    Initial ->
                        if (List.length selectedItems) < config.maxItems then
                            input [ onBlurAtt, onInputAtt ] []
                        else
                            input [ onBlurAtt, onInputAtt, maxlength 0 ] []

                    Idle ->
                        if (List.length selectedItems) < config.maxItems then
                            input [ onBlurAtt, onInputAtt ] []
                        else
                            input [ onBlurAtt, onInputAtt, maxlength 0 ] []

                    Editing ->
                        let
                            actualMaxlength =
                                if List.length boxItems == 0 then
                                    0
                                else
                                    524288
                        in
                            input [ maxlength actualMaxlength, onBlurAtt, onInputAtt, class h.classes.inputEditing ] []

                    Cleared ->
                        input [ onKeyUp config items state, value "", onBlurAtt, onInputAtt ] []

                    Blurred ->
                        input [ maxlength 0, onFocusAtt, value "" ] []
        in
            div [ class h.classes.container ]
                [ label
                    [ classList
                        [ ( h.classes.singleItemContainer, config.maxItems == 1 )
                        , ( h.classes.multiItemContainer, config.maxItems > 1 )
                        , ( className config.htmlOptions.customCssClass, True)
                        ]
                    ]
                    [ span [ class h.classes.selectBox, keyDown ]
                        [ span [] [ itemsView config items fallbackItems state ]
                        , editInput
                        ]
                    , boxView config items state
                    ]
                ]


onInput : Config msg idType itemType -> State -> Attribute msg
onInput config state =
    let
        tagger s =
            if (String.length s == 0) then
                config.toMsg { state | status = Idle, string = s }
            else
                config.toMsg { state | status = Editing, string = s }
    in
        E.onInput tagger


onMouseDown : Config msg idType itemType -> State -> idType -> Attribute msg
onMouseDown config state id =
    E.onMouseDown (config.onAdd id state)


onBlur : Config msg idType itemType -> State -> Attribute msg
onBlur config state =
    E.onBlur (config.onBlur { state | status = Blurred })


onFocus : Config msg idType itemType -> State -> Attribute msg
onFocus config state =
    E.onFocus (config.onFocus { state | status = Initial, boxPosition = -1 })


onKeyDownDelete : Config msg idType itemType -> Items itemType -> State -> Attribute msg
onKeyDownDelete config items state =
    rawOnKeyDown deleteSpecialKeys (updateKeyDown config items state)


onKeyDownNoDelete : Config msg idType itemType -> Items itemType -> State -> Attribute msg
onKeyDownNoDelete config items state =
    rawOnKeyDown noDeleteSpecialKeys (updateKeyDown config items state)


onKeyDown : Config msg idType itemType -> Items itemType -> State -> Attribute msg
onKeyDown config items state =
    rawOnKeyDownNoPrevent (updateKeyDown config items state)


onKeyUp : Config msg idType itemType -> Items itemType -> State -> Attribute msg
onKeyUp config items state =
    rawOnKeyUp (updateKeyUp config items state)


noDeleteSpecialKeys : List Int
noDeleteSpecialKeys =
    [ 8, 38, 40, 9, 13, 27 ]


deleteSpecialKeys : List Int
deleteSpecialKeys =
    [ 38, 40, 9, 13, 27 ]


preventSpecialDecoder : List Int -> Json.Decoder Int
preventSpecialDecoder specialKeys =
    E.keyCode
        |> Json.andThen
            (\code ->
                if List.member code specialKeys then
                    Json.succeed code
                else
                    Json.fail "don't prevent"
            )


rawOnKeyDown : List Int -> (Int -> msg) -> Attribute msg
rawOnKeyDown specialKeys tagger =
    let
        options =
            { stopPropagation = False, preventDefault = True }
    in
        onWithOptions "keydown" options (Json.map tagger (preventSpecialDecoder specialKeys))


rawOnKeyDownNoPrevent : (Int -> msg) -> Attribute msg
rawOnKeyDownNoPrevent tagger =
    onWithOptions "keydown" { stopPropagation = False, preventDefault = False } (Json.map tagger E.keyCode)


rawOnKeyUp : (Int -> msg) -> Attribute msg
rawOnKeyUp tagger =
    on "keyup" (Json.map tagger E.keyCode)
