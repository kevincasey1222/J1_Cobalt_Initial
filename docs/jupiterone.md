# Integration with JupiterOne

## {{provider}} + JupiterOne Integration Benefits

TODO: Iterate the benefits of ingesting data from the provider into JupiterOne.
Consider the following examples:

- Visualize Cobalt pentests, findings, and the assets tested in the JupiterOne
  graph.
- Monitor changes to Cobalt pentests and findings using JupiterOne alerts.
- Correlate pentests with other logged security events.

## How it Works

- JupiterOne periodically fetches pentests, findings, and assets from Cobalt to
  update the graph.
- Write JupiterOne queries to review and monitor updates to the graph.
- Configure alerts to take action when JupiterOne graph changes.

## Requirements

TODO: Iterate requirements for setting up the integration. Consider the
following examples:

- You will need both a REST API key and an organizational token from Cobalt.
- You must have permission in JupiterOne to install new integrations.

## Support

If you need help with this integration, please contact
[JupiterOne Support](https://support.jupiterone.io).

## Integration Walkthrough

### In Cobalt

TODO: List specific actions that must be taken in the provider. Remove this
section when there are no actions to take in the provider.

1. [Generate a REST API key](https://example.com/docs/generating-api-keys)

### In JupiterOne

1. From the configuration **Gear Icon**, select **Integrations**.
2. Scroll to the **Cobalt** integration tile and click it.
3. Click the **Add Configuration** button.
4. Enter the **Account Name** by which you'd like to identify this Cobalt
   account in JupiterOne. Ingested entities will have this value stored in
   `tag.AccountName` when **Tag with Account Name** is checked.
5. Enter a **Description** that will further assist your team when identifying
   the integration instance.
6. Select a **Polling Interval** that you feel is sufficient for your monitoring
   needs. You may leave this as `DISABLED` and manually execute the integration.
7. Enter your **Cobalt API Key**.
8. Enter your **Cobalt Org Token**.
9. Click **Create Configuration** once all values are provided.

# How to Uninstall

1. From the configuration **Gear Icon**, select **Integrations**.
2. Scroll to the **Cobalt** integration tile and click it.
3. Identify and click the **integration to delete**.
4. Click the **trash can** icon.
5. Click the **Remove** button to delete the integration.

<!-- {J1_DOCUMENTATION_MARKER_START} -->
<!--
********************************************************************************
NOTE: ALL OF THE FOLLOWING DOCUMENTATION IS GENERATED USING THE
"j1-integration document" COMMAND. DO NOT EDIT BY HAND! PLEASE SEE THE DEVELOPER
DOCUMENTATION FOR USAGE INFORMATION:

https://github.com/JupiterOne/sdk/blob/master/docs/integrations/development.md
********************************************************************************
-->

## Data Model

### Entities

The following entities are created:

| Resources      | Entity `_type`   | Entity `_class` |
| -------------- | ---------------- | --------------- |
| Cobalt Account | `cobalt_account` | `Account`       |
| Cobalt Finding | `cobalt_finding` | `Finding`       |
| Cobalt Pentest | `cobalt_pentest` | `Assessment`    |

### Relationships

The following relationships are created/mapped:

| Source Entity `_type` | Relationship `_class` | Target Entity `_type` |
| --------------------- | --------------------- | --------------------- |
| `cobalt_account`      | **HAS**               | `cobalt_finding`      |
| `cobalt_account`      | **HAS**               | `cobalt_pentest`      |

<!--
********************************************************************************
END OF GENERATED DOCUMENTATION AFTER BELOW MARKER
********************************************************************************
-->
<!-- {J1_DOCUMENTATION_MARKER_END} -->
