# Events
- ready
- message

## Message Object 
.message
    .content
    .member
        .voice *VoiceState*
            .channel *VoiceChannel*
            .setDeaf
            .connections *Collection<VoiceConnection>*
                    .receiver *VoiceReceiver*
                        .createStream
    .channel *TextChannel* 
        .send
        .members *Collection<GuildMember>*
    .reply
    .guild Guild
.client
    .user
        .id


voicechannel
    .disconnect
    .join
    .members *Collection<GuildMember>*
            .user *User*
                .bot *boolean*