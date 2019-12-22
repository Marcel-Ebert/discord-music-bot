import { Command } from "discord-akairo"
import { Guild, GuildMember, Message, TextChannel, RichEmbed } from "discord.js"
import MusicPlayer from "../../libs/MusicPlayer"
import MusicPlayerManager from "../../libs/MusicPlayerManager"
import { trackError } from "../../shared/util/trackError"

export abstract class MusicCommand extends Command {
  protected musicPlayer: MusicPlayer
  protected guild: Guild
  protected member: GuildMember
  protected message?: Message

  abstract execute(args: { data: any }): void | Promise<void>

  private async initPlayer(member: GuildMember) {
    this.musicPlayer = MusicPlayerManager.getPlayerFor(member.guild.id)
    if (!this.musicPlayer) {
      if (!member.voiceChannel) {
        throw new Error("You have to be connected to a voice channel...")
      } else if (!member.voiceChannel.joinable) {
        throw new Error(`Could not join voice channel of ${member.displayName}`)
      } else {
        this.musicPlayer = await MusicPlayerManager.createPlayerFor(member.guild.id, member.voiceChannel)
        this.musicPlayer.subscribe({
          next: message => {
            if (message.messageType === "info" || message.messageType === "error") {
              this.sendMessageToChannel(message.message)
            }
          }
        })
      }
    }
  }

  async exec(message: Message, args: CommandMessage | any) {
    if (!message) {
      return this.executeSilent(args)
    } else {
      this.message = message
      this.guild = message.guild
      this.member = message.member

      try {
        await this.initPlayer(this.member)
        this.execute(args)
      } catch (error) {
        trackError(error, "MusicCommand.exec")
        if (error instanceof Error) {
          this.sendMessageToChannel(error.message)
        } else {
          this.sendMessageToChannel(error)
        }
      }
    }
  }

  async executeSilent(args: CommandMessage) {
    const { guildID, userID, data } = args
    const guild = this.client.guilds.find(g => g.id === guildID)
    const member = guild.members.find(m => m.id === userID)

    this.guild = guild
    this.member = member

    await this.initPlayer(this.member)

    this.execute({ data })
  }

  sendMessageToChannel(message: string | RichEmbed) {
    const defaultChannel = this.guild.channels.find(
      channel => channel.name === "general" && channel.type === "text"
    ) as TextChannel

    if (defaultChannel && message) {
      defaultChannel.send(message)
    }
  }
}
