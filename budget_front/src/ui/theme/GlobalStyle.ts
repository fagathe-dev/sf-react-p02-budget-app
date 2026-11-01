import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  /* Polices Google Fonts du Design System */
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wdth,wght@62.5..100,300&family=Quicksand:wght@300..700&family=Roboto&family=Roboto+Flex:opsz,wght,XOPQ,XTRA,YOPQ,YTDE,YTFI,YTLC,YTUC@8..144,100..1000,96,468,79,-203,738,514,712&display=swap');

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html {
    font-size: 100%;
    -webkit-text-size-adjust: 100%;
    tab-size: 4;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: ${({ theme }) => theme.typography.fonts.sans};
    font-size: ${({ theme }) => theme.typography.sizes.base};
    line-height: ${({ theme }) => theme.typography.lineHeights.normal};
    color: ${({ theme }) => theme.colors.text.body};
    background-color: ${({ theme }) => theme.colors.background.body};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  h1, h2, h3, h4, h5, h6 {
    color: ${({ theme }) => theme.colors.text.heading};
    margin-top: 0;
    margin-bottom: ${({ theme }) => theme.spacing[2]};
    font-weight: ${({ theme }) => theme.typography.weights.semibold};
    line-height: ${({ theme }) => theme.typography.lineHeights.tight};
  }

  p {
    margin-top: 0;
    margin-bottom: ${({ theme }) => theme.spacing[3]};
  }

  button, input, optgroup, select, textarea {
    font-family: inherit;
    font-size: 100%;
    line-height: inherit;
    margin: 0;
  }

  :focus-visible {
    outline: ${({ theme }) =>
      `${theme.borders.focusRing.width} solid ${theme.borders.focusRing.color}`};
    outline-offset: ${({ theme }) => theme.borders.focusRing.offset};
  }
`;
