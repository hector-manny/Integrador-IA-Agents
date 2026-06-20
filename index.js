import { main } from './src/cli/cli.js';

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(
      JSON.stringify(
        {
          error: true,
          code: 'CLI_FATAL',
          message: error?.message ?? 'Unexpected CLI error',
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  });
