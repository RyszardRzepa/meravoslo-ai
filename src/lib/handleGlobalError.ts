export function handleGlobalError(error: unknown) {
  if (error instanceof Error) {
    // Log error to your monitoring service
    console.error(error);

    const url = process.env.SLACK_ERROR_CHANNEL_URL!
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: `Error: ${error.message}`,
      }),
    })

    // Show user-friendly message
    return {
      message: 'Something went wrong. Please try again later.',
      status: 500,
    };
  }

  return {
    message: 'An unexpected error occurred',
    status: 500,
  };
}
