import * as React from 'react';
import { Link } from '@mui/docs/Link';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';

export default function BacklinkSponsor(props: {
  item: {
    name: string;
    description: string;
    href: string;
  };
}) {
  const { item } = props;
  // Keep it under two rows maximum.
  if (item.description.length > 50) {
    throw new Error(
      `${item.name}'s description is too long (${item.description.length} characters). It must fit into two line, so under 50 characters.`,
    );
  }

  return (
    <Link
      data-ga-event-category="sponsor"
      data-ga-event-action="homepage"
      data-ga-event-label={new URL(item.href).hostname}
      href={item.href}
      title={item.description}
      target="_blank"
      rel="sponsored noopener"
      sx={{ mr: { xs: 2, md: 3 }, mt: { xs: 2, md: 3 } }}
    >
      {item.name}
      <OpenInNewRoundedIcon sx={{ fontSize: 16, ml: 1, verticalAlign: 'middle' }} />
    </Link>
  );
}
