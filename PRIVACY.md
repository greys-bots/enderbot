# Privacy Policy
## Collected data
Enderbot collects very little of your data. In order to function, these are the things that are collected and stored indefinitely:
- Anything you provide to the bot through commands. This primarily includes configuration data
- Discord-provided server, user, and role IDs, as part of indexing mod roles, handling starred messages, and managing configurations
- Daily backups of the above

## Storage and access
Data is stored using PostgreSQL on a secure and private server. The data is only accessible by the developers of the bot; no one else has been given access.

## Usage
Data collected by the bot is used in a few ways:
### Server IDs
Server IDs are used to differentiate data across servers and store server-specific configuration.

### User IDs
User IDs are used to differentiate between users that have starred messages and to store user-specific configuration.

### Role IDs
Role IDs are stored to keep track of roles that are opped, or set as mod roles.

### Stats
Stats such as how many messages you've had starred and how many messages you have personally starred may be saved to the database and associated with your user ID as part of leaderboard functionality. You can opt out of the global functionality of this at any time by using the proper command. Note that message content is never visible outside of the server it belongs to, and it is never stored in the database; it is always manually fetched where it is visible.

## Removing data
Most data can easily be deleted by using the proper command to delete it. Note that this will not remove data from any existing backups of it, and that it is still possible to lose access to some data by leaving servers or removing the bot from your server.  
If you would like inaccessible data deleted, feel free to contact us using the information below. Keep in mind that we likely won't be able to remove any messages directly from starboard channels, and you should use built-in methods to delete those messages.

## Contact
If desired, you can contact us at `@greysdawn` on Discord or [join the support server](https://discord.gg/EvDmXGt) to ask us to remove any other data. This is also where we can be contacted about privacy concerns if necessary.
