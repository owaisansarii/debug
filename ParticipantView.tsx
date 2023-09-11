/* eslint-disable react-native/no-inline-styles */
import * as React from 'react';

import {
  Dimensions,
  // Image,
  Pressable,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import type { Participant, TrackPublication } from 'livekit-client';
import { useParticipant, VideoView } from '@livekit/react-native';
import { View } from 'react-native';
import { Text } from 'react-native';

import { Icon } from '@rneui/base';
import { useSelector } from 'react-redux';
import commonStyles from '../../../../styles/commonStyles';
import { moderateScale } from '../../../../utils/responsiveSize';
// import {useEffect} from 'react';
// import imagePath from '../../../../assets/imagePath';
import LinearGradient from 'react-native-linear-gradient';
export type Props = {
  participant: Participant;
  style?: ViewStyle;
  onPress?: () => void;
  revokePermission: ({
    userId,
    username,
  }: {
    userId: string;
    username?: string;
  }) => void;
  host?: string;
  isPinned?: boolean;
  isFullScreen?: boolean;
  removePinned: () => void;
  setIsFullScreen: (isFullScreen: boolean) => void;
  setFullScreenParticipant: (participant: Participant | null) => void;
  isCameraFronFacing?: boolean;
  fromFullScreen?: boolean;
  resizeMode?: 'cover' | 'contain';
  showBorder?: boolean;
  // add_remove_pinned: (Participant: Participant) => void;
  handleItemClick: () => void;
};

export const ParticipantView = ({
  style = {},
  participant,
  host,
  isPinned = false,
  isFullScreen = false,
  setIsFullScreen,
  setFullScreenParticipant,
  isCameraFronFacing = false,
  fromFullScreen = false,
  resizeMode = 'cover',
  showBorder = true,
  handleItemClick,
}: // add_remove_pinned,
Props) => {
  const { cameraPublication, screenSharePublication, isSpeaking } =
    useParticipant(participant);
  const { theme } = useSelector((state: any) => state.theme);
  const [displayName] = React.useState(
    participant.name ? participant.name : participant.identity
  );
  const [showOverlay, setShowOverlay] = React.useState(false);
  // console.log('---', screenSharePublication);
  React.useEffect(() => {
    let timer: any;
    if (showOverlay) {
      timer = setTimeout(() => {
        setShowOverlay(false);
        console.log('overlay hidden');
      }, 3000);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [showOverlay]);
  const condition =
    cameraPublication &&
    cameraPublication.isSubscribed &&
    !cameraPublication.isMuted;

  if (!participant) {
    return null;
  }
  return (
    <Pressable
      style={{
        height: '100%',
        width: '100%',
        flex: 1,
        backgroundColor: theme?.background,
        // borderRadius: moderateScale(10),
        overflow: 'hidden',
        zIndex: -1,
        borderColor: isSpeaking ? 'white' : 'transparent',
        borderWidth: showBorder ? 1 : 0,
        ...style,
      }}
      onPress={() => {
        handleItemClick ? handleItemClick() : setShowOverlay(true);
        console.log('overlay shown', participant);
        // meta data
        console.log('meta data', participant.metadata);
      }}
    >
      <VideoViewLiveKit
        videoPublication={
          condition ? cameraPublication : screenSharePublication
        }
        isCameraFronFacing={isCameraFronFacing}
        currentParticipant={participant}
        resizeMode={resizeMode}
      />
      {!fromFullScreen && (
        <View
          style={[
            styles.identityBar,
            {
              backgroundColor: 'transparent',
              height: isPinned ? 56 : 40,
              bottom: -2,
              left: -2,
              // maxWidth: '40%',
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0)']}
            useAngle={true}
            angle={270}
            // increase width of black gradient
            locations={[0.7, 1]}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              // backgroundColor: 'rgba(0,0,0,0.5)',
              paddingHorizontal: 10,
              paddingVertical: 5,
              // borderRadius: 10,
              borderTopRightRadius: 10,
              // width: '100%',
              // maxWidth: '50%',
            }}
          >
            <Icon
              name={
                participant.isMicrophoneEnabled
                  ? 'microphone'
                  : 'microphone-slash'
              }
              size={isPinned ? 16 : 16}
              type="font-awesome-5"
              color={theme?.text}
              style={{
                marginHorizontal: isPinned
                  ? moderateScale(10)
                  : moderateScale(5),
              }}
            />
            <Text
              style={[
                commonStyles.fontBold14,
                {
                  color: theme?.text,
                  marginLeft: 5,
                  fontSize: isPinned ? 16 : 12,
                  // maxWidth: '90%',
                },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {displayName} {host === participant.identity ? '(Host)' : ''}
              hhhhhhhhhkkk
            </Text>
          </LinearGradient>
        </View>
      )}

      {showOverlay && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: 'rgba(0,0,0,0.5)',
              paddingHorizontal: 15,
              paddingVertical: 5,
              borderRadius: 15,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* full screen */}
            <TouchableOpacity
              onPress={() => {
                setIsFullScreen(!isFullScreen);
                if (!isFullScreen) {
                  // alert('full screen');
                  setFullScreenParticipant(participant);
                } else {
                  // alert('exit full screen');
                  setFullScreenParticipant(null);
                }
              }}
            >
              <Icon
                name={!isFullScreen ? 'fullscreen' : 'fullscreen-exit'}
                size={25}
                color={theme?.text}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Pressable>
  );
};

const VideoViewLiveKit = ({
  videoPublication,
  isCameraFronFacing,
  currentParticipant,
  resizeMode,
}: {
  videoPublication: TrackPublication | undefined;
  isCameraFronFacing: boolean;
  currentParticipant: Participant;
  resizeMode: 'cover' | 'contain';
}) => {
  const { theme } = useSelector((state: any) => state.theme);
  const { userDetails } = useSelector((state: any) => state.user);

  if (videoPublication?.source === 'screen_share') {
    return (
      <VideoView
        style={styles.videoView}
        videoTrack={videoPublication?.videoTrack}
        objectFit={resizeMode}
        zOrder={1000}
      />
    );
  } else {
    if (
      videoPublication &&
      videoPublication.isSubscribed &&
      !videoPublication.isMuted
    ) {
      return (
        <VideoView
          style={styles.videoView}
          videoTrack={videoPublication?.videoTrack}
          objectFit={resizeMode}
          mirror={
            !isCameraFronFacing &&
            userDetails._id === currentParticipant.identity
          }
          zOrder={1000}
        />
      );
    } else {
      return (
        <View style={styles.videoView}>
          <View style={styles.spacer} />
          <Icon
            name="video-slash"
            size={moderateScale(30)}
            type="font-awesome-5"
            color={theme?.text}
          />
          <View style={styles.spacer} />
        </View>
      );
    }
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    // height: moderateScale(272),
    borderRadius: moderateScale(10),
    overflow: 'hidden',
  },
  containerNonPinned: {
    height: moderateScale(120),
    width: Dimensions.get('window').width / 2 - moderateScale(30),
    borderRadius: moderateScale(10),
    overflow: 'hidden',
  },
  spacer: {
    flex: 1,
  },
  videoView: {
    flexDirection: 'column',
    height: '100%',
    borderRadius: moderateScale(10),
  },
  identityBar: {
    position: 'absolute',

    width: '100%',
    zIndex: 1,
    paddingVertical: 2,
    paddingHorizontal: 5,
    justifyContent: 'space-between',
    flexDirection: 'row',
    // borderBottomEndRadius: moderateScale(10),
    // borderBottomLeftRadius: moderateScale(10),
    // borderBottomRightRadius: moderateScale(10),
  },
  icon: {
    width: 40,
    height: 40,
    alignSelf: 'center',
  },
  identityBarTop: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 1,
    paddingVertical: 2,
    paddingHorizontal: 5,
    height: 30,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  VideoView10: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 35,
  },
  VideoView11: {
    position: 'absolute',
    alignSelf: 'center',
    height: '55%',
    justifyContent: 'flex-end',
  },
});
