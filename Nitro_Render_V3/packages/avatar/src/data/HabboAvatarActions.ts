export const HabboAvatarActions = {
    'actions': [
        {
            'id': 'Default',
            'state': 'std',
            'precedence': 1000,
            'main': true,
            'isDefault': true,
            'geometryType': 'vertical',
            'activePartSet': 'figure',
            'assetPartDefinition': 'std',
            'prevents': [],
            'animation': false
        },
        {
            'id': 'Lay',
            'state': 'lay',
            'precedence': 900,
            'main': true,
            'geometryType': 'laying',
            'activePartSet': 'figure',
            'assetPartDefinition': 'lay',
            'prevents': ['sit', 'float', 'swim'],
            'animation': false
        },
        {
            'id': 'Float',
            'state': 'float',
            'precedence': 850,
            'main': true,
            'geometryType': 'vertical',
            'activePartSet': 'figure',
            'assetPartDefinition': 'std',
            'prevents': ['sit', 'lay'],
            'animation': false
        },
        {
            'id': 'Swim',
            'state': 'swim',
            'precedence': 820,
            'main': true,
            'geometryType': 'vertical',
            'activePartSet': 'figure',
            'assetPartDefinition': 'swm',
            'prevents': ['sit', 'lay'],
            'animation': true
        },
        {
            'id': 'Sit',
            'state': 'sit',
            'precedence': 800,
            'main': true,
            'geometryType': 'sitting',
            'activePartSet': 'figure',
            'assetPartDefinition': 'sit',
            'prevents': ['lay', 'float', 'swim'],
            'animation': false
        },
        {
            'id': 'Move',
            'state': 'mv',
            'precedence': 700,
            'main': true,
            'geometryType': 'vertical',
            'activePartSet': 'figure',
            'assetPartDefinition': 'wlk',
            'prevents': ['sit', 'lay'],
            'animation': true
        },
        {
            'id': 'Talk',
            'state': 'talk',
            'precedence': 600,
            'activePartSet': 'head',
            'assetPartDefinition': 'tlk',
            'prevents': [],
            'animation': true
        },
        {
            'id': 'Wave',
            'state': 'wave',
            'precedence': 500,
            'activePartSet': 'handRight',
            'assetPartDefinition': 'wav',
            'prevents': [],
            'animation': true
        },
        {
            'id': 'Blow',
            'state': 'blow',
            'precedence': 500,
            'activePartSet': 'handRight',
            'assetPartDefinition': 'blw',
            'prevents': [],
            'animation': true
        },
        {
            'id': 'Laugh',
            'state': 'laugh',
            'precedence': 500,
            'activePartSet': 'head',
            'assetPartDefinition': 'laugh',
            'prevents': [],
            'animation': true
        },
        {
            'id': 'Cry',
            'state': 'cry',
            'precedence': 500,
            'activePartSet': 'head',
            'assetPartDefinition': 'cry',
            'prevents': [],
            'animation': true
        },
        {
            'id': 'Idle',
            'state': 'idle',
            'precedence': 500,
            'activePartSet': 'head',
            'assetPartDefinition': 'idle',
            'prevents': [],
            'animation': true
        },
        {
            'id': 'Respect',
            'state': 'respect',
            'precedence': 500,
            'activePartSet': 'handLeft',
            'assetPartDefinition': 'respect',
            'prevents': [],
            'animation': true
        },
        {
            'id': 'Sign',
            'state': 'sign',
            'precedence': 400,
            'activePartSet': 'handLeft',
            'assetPartDefinition': 'sig',
            'prevents': [],
            'animation': true
        },
        {
            'id': 'Sleep',
            'state': 'sleep',
            'precedence': 300,
            'activePartSet': 'eye',
            'assetPartDefinition': 'eyb',
            'prevents': [],
            'animation': false
        },
        {
            'id': 'Dance',
            'state': 'dance',
            'precedence': 500,
            'main': true,
            'geometryType': 'vertical',
            'activePartSet': 'figure',
            'assetPartDefinition': '',
            'prevents': [],
            'animation': true,
            'preventHeadTurn': true,
            'types': [
                {
                    'id': 1,
                    'animated': true,
                    'prevents': [],
                    'preventHeadTurn': false
                },
                {
                    'id': 2,
                    'animated': true,
                    'prevents': ['wave', 'cri', 'usei'],
                    'preventHeadTurn': true
                },
                {
                    'id': 3,
                    'animated': true,
                    'prevents': ['wave', 'cri', 'usei'],
                    'preventHeadTurn': true
                },
                {
                    'id': 4,
                    'animated': true,
                    'prevents': ['wave', 'cri', 'usei'],
                    'preventHeadTurn': true
                }
            ]
        },
        {
            'id': 'CarryItem',
            'state': 'cri',
            'precedence': 500,
            'activePartSet': 'handRight',
            'assetPartDefinition': 'crr',
            'prevents': [],
            'animation': false,
            'params': [
                { 'id': 'default', 'value': '1' }
            ]
        },
        {
            'id': 'UseItem',
            'state': 'usei',
            'precedence': 500,
            'activePartSet': 'handRight',
            'assetPartDefinition': 'drk',
            'prevents': [],
            'animation': true,
            'params': [
                { 'id': 'default', 'value': '1' }
            ]
        },
        {
            'id': 'AvatarEffect',
            'state': 'fx',
            'precedence': 500,
            'activePartSet': 'figure',
            'assetPartDefinition': '',
            'prevents': [],
            'animation': true,
            'startFromFrameZero': true
        },
        {
            'id': 'Vote',
            'state': 'vote',
            'precedence': 500,
            'activePartSet': 'handLeft',
            'assetPartDefinition': 'vote',
            'prevents': [],
            'animation': true
        },
        {
            'id': 'Typing',
            'state': 'typing',
            'precedence': 100,
            'activePartSet': 'handLeft',
            'assetPartDefinition': '',
            'prevents': [],
            'animation': false
        },
        {
            'id': 'RideJump',
            'state': 'ridejump',
            'precedence': 500,
            'activePartSet': 'figure',
            'assetPartDefinition': '',
            'prevents': [],
            'animation': true,
            'startFromFrameZero': true
        },
        {
            'id': 'SnowBoardOllie',
            'state': 'sbollie',
            'precedence': 500,
            'activePartSet': 'figure',
            'assetPartDefinition': '',
            'prevents': [],
            'animation': true,
            'startFromFrameZero': true
        },
        {
            'id': 'SnowBoard360',
            'state': 'sb360',
            'precedence': 500,
            'activePartSet': 'figure',
            'assetPartDefinition': '',
            'prevents': [],
            'animation': true,
            'startFromFrameZero': true
        },
        {
            'id': 'SnowWarRun',
            'state': 'swrun',
            'precedence': 700,
            'main': true,
            'geometryType': 'vertical',
            'activePartSet': 'figure',
            'assetPartDefinition': 'swm',
            'prevents': ['sit', 'lay'],
            'animation': true
        },
        {
            'id': 'SnowWarDieFront',
            'state': 'swdiefront',
            'precedence': 900,
            'main': true,
            'geometryType': 'vertical',
            'activePartSet': 'figure',
            'assetPartDefinition': 'std',
            'prevents': [],
            'animation': false
        },
        {
            'id': 'SnowWarDieBack',
            'state': 'swdieback',
            'precedence': 900,
            'main': true,
            'geometryType': 'vertical',
            'activePartSet': 'figure',
            'assetPartDefinition': 'std',
            'prevents': [],
            'animation': false
        },
        {
            'id': 'SnowWarPick',
            'state': 'swpick',
            'precedence': 500,
            'activePartSet': 'handRight',
            'assetPartDefinition': 'crr',
            'prevents': [],
            'animation': true,
            'startFromFrameZero': true
        },
        {
            'id': 'SnowWarThrow',
            'state': 'swthrow',
            'precedence': 500,
            'activePartSet': 'handRight',
            'assetPartDefinition': 'drk',
            'prevents': [],
            'animation': true,
            'startFromFrameZero': true
        },
        {
            'id': 'GestureSmile',
            'state': 'sml',
            'precedence': 200,
            'activePartSet': 'head',
            'assetPartDefinition': 'sml',
            'prevents': [],
            'animation': false
        },
        {
            'id': 'GestureAggravated',
            'state': 'agr',
            'precedence': 200,
            'activePartSet': 'head',
            'assetPartDefinition': 'agr',
            'prevents': [],
            'animation': false
        },
        {
            'id': 'GestureSurprised',
            'state': 'srp',
            'precedence': 200,
            'activePartSet': 'head',
            'assetPartDefinition': 'srp',
            'prevents': [],
            'animation': false
        },
        {
            'id': 'GestureSad',
            'state': 'sad',
            'precedence': 200,
            'activePartSet': 'head',
            'assetPartDefinition': 'sad',
            'prevents': [],
            'animation': false
        }
    ]
};
