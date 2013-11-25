## Copyright (C) 2007  Soren Hauberg
## 
## This program is free software; you can redistribute it and/or modify
## it under the terms of the GNU General Public License as published by
## the Free Software Foundation; either version 3, or (at your option)
## any later version.
## 
## This program is distributed in the hope that it will be useful, but
## WITHOUT ANY WARRANTY; without even the implied warranty of
## MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
## General Public License for more details. 
## 
## You should have received a copy of the GNU General Public License
## along with this file.  If not, see <http://www.gnu.org/licenses/>.

## -*- texinfo -*-
## @deftypefn {Function File} @var{J} = imfilter(@var{I}, @var{f})
## @deftypefnx{Function File} @var{J} = imfilter(@var{I}, @var{f}, @var{options}, ...)
## Computes the linear filtering of the image @var{I} and the filter @var{f}.
## The computation is performed using double precision floating point numbers,
## but the class of the input image is preserved as the following example shows.
## @example
## I = 255*ones(100, 100, "uint8");
## f = fspecial("average", 3);
## J = imfilter(I, f);
## class(J)
## @result{} ans = uint8
## @end example
##
## The function also accepts a number of optional arguments that control the
## details of the filtering. The following options is currently accepted
## @table @samp
## @item S
## If a scalar input argument is given, the image is padded with this scalar
## as part of the filtering. The default value is 0.
## @item "symmetric"
## The image is padded symmetrically. 
## @item "replicate"
## The image is padded using the border of the image.
## @item "circular"
## The image is padded by circular repeating of the image elements.
## @item "same"
## The size of the output image is the same as the input image. This is the default
## behaviour.
## @item "full"
## Returns the full filtering result.
## @item "corr"
## The filtering is performed using correlation. This is the default behaviour.
## @item "conv"
## The filtering is performed using convolution.
## @end table
## @seealso{conv2, filter2, fspecial, padarray}
## @end deftypefn

function retval = imfilter(im, f, varargin)
  ## Check number of input arguments
  if (nargin < 2)
    print_usage();
  endif
  
  ## Check image
  if (!ismatrix(im))
    error("imfilter: first input argument must be an image");
  endif
  [imrows, imcols, imchannels, tmp] = size(im);
  if (tmp != 1 || (imchannels != 1 && imchannels != 3))
    error("imfilter: first input argument must be an image");
  endif
  C = class(im);
  
  ## Check filter (XXX: matlab support 3D filter, but I have no idea what they do with them)
  if (!ismatrix(f))
    error("imfilter: second input argument must be a matrix");
  endif
  [frows, fcols, tmp] = size(f);
  if (tmp != 1)
    error("imfilter: second argument must be a 2-dimensional matrix");
  endif
  
  ## Parse options
  res_size = "same";
  res_size_options = {"same", "full"};
  pad = 0;
  pad_options = {"symmetric", "replicate", "circular"};
  ftype = "corr";
  ftype_options = {"corr", "conv"};
  for i = 1:length(varargin)
    v = varargin{i};
    if (any(strcmpi(v, pad_options)) || isscalar(v))
      pad = v;
    elseif (any(strcmpi(v, res_size_options)))
      res_size = v;
    elseif (any(strcmpi(v, ftype_options)))
      ftype = v;
    else
      warning("imfilter: cannot handle input argument number %d", i+2);
    endif
  endfor
  
  ## Pad the image
  im = padarray(im, floor([frows/2, fcols/2]), pad);
  if (mod(frows,2) == 0)
    im = im(1:end-1, :, :);
  endif
  if (mod(fcols,2) == 0)
    im = im(:, 1:end-1, :);
  endif
  
  ## Do the filtering
  if (strcmpi(res_size, "same"))
    res_size = "valid";
  else # res_size == "full"
    res_size = "same";
  endif
  if (strcmpi(ftype, "corr"))
    for i = imchannels:-1:1
      retval(:,:,i) = filter2(f, im(:,:,i), res_size);
    endfor
  else
    for i = imchannels:-1:1
      retval(:,:,i) = conv2(im(:,:,i), f, res_size);
    endfor
  endif
  
  ## Change the class of the output to the class of the input
  ## (the filtering functions returns doubles)
  retval = cast(retval, C);
  
endfunction
