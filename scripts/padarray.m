## Copyright (C) 2004 Josep Mones i Teixidor
##
## This program is free software; you can redistribute it and/or modify
## it under the terms of the GNU General Public License as published by
## the Free Software Foundation; either version 2 of the License, or
## (at your option) any later version.
##
## This program is distributed in the hope that it will be useful,
## but WITHOUT ANY WARRANTY; without even the implied warranty of
## MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
## GNU General Public License for more details.
##
## You should have received a copy of the GNU General Public License
## along with this program; If not, see <http://www.gnu.org/licenses/>.

## -*- texinfo -*-
## @deftypefn {Function File} {@var{B} = } padarray (@var{A},@var{padsize})
## @deftypefnx {Function File} {@var{B} = } padarray (@var{A},@var{padsize},@var{padval})
## @deftypefnx {Function File} {@var{B} = } padarray (@var{A},@var{padsize},@var{padval},@var{direction})
## Pads an array in a configurable way.
##
## B = padarray(A,padsize) pads an array @var{A} with zeros, where
## @var{padsize} defines the amount of padding to add in each dimension
## (it must be a vector of positive integers). 
##
## Each component of @var{padsize} defines the number of elements of
## padding that will be added in the corresponding dimension. For
## instance, [4,5] adds 4 elements of padding in first dimension (vertical)
## and 5 in second dimension (horizontal).
##
## B = padarray(A,padsize,padval) pads @var{A} using the value specified
## by @var{padval}. @var{padval} can be a scalar or a string. Possible
## values are:
##
## @table @asis
## @item 0
## Pads with 0 as described above. This is the default behaviour.
## @item Scalar
## Pads using @var{padval} as a padding value.
## @item "Circular"
## Pads with a circular repetition of elements in @var{A} (similar to
## tiling @var{A}).
## @item "Replicate"
## Pads replicating values of @var{A} which are at the border of the
## array.
## @item "Symmetric"
## Pads with a mirror reflection of @var{A}.
## @item "Reflect"
## Same as "symmetric", but the borders are not used in the padding.
## @end table
##
## B = padarray(A,padsize,padval,direction) pads @var{A} defining the
## direction of the pad. Possible values are:
##
## @table @asis
## @item "Both"
## For each dimension it pads before the first element the number
## of elements defined by @var{padsize} and the same number again after
## the last element. This is the default value.
## @item "Pre"
## For each dimension it pads before the first element the number of
## elements defined by @var{padsize}.
## @item "Post"
## For each dimension it pads after the last element the number of
## elements defined by @var{padsize}.
## @end table
## @end deftypefn

## Author:  Josep Mones i Teixidor <jmones@puntbarra.com>

function B = padarray(A, padsize, padval = 0, direction = "both")
  # Check parameters
  if (nargin < 2 || nargin > 4)
    print_usage();
  endif

  if (!isvector(padsize) || !isnumeric(padsize) || any(padsize < 0) || any(padsize != round(padsize)))
    error("padarray: padsize must be a vector of positive integers.");
  endif
  if (!isscalar(padval) && !ischar(padval))
    error("padarray: third input argument must be a string or a scalar");
  endif
  if (!ischar(direction) || strcmpi(direction, {"pre", "post", "both"}))
    error("padarray: fourth input argument must be 'pre', 'post', or 'both'");
  endif

  ## Assure padsize is a row vector
  padsize = padsize(:).';

  # Check direction
  pre  = any(strcmpi(direction, {"pre", "both"}));
  post = any(strcmpi(direction, {"post", "both"}));
  
  B = A;
  dim = 1;
  for s = padsize
    if (s > 0)
      # padding in this dimension was requested
      ds = size(B);
      ds = [ds, ones(1,dim-length(ds))]; # data size
      ps = ds;
      ps(dim) = s;		       # padding size

      if (ischar(padval))
	# Init a "index all" cell array. All cases need it.
	idx = cell(1, length(ds));
	for i = 1:length(ds)
	  idx{i} = 1:ds(i);
	endfor

	switch (padval)
	  case ("circular")
	    complete = 0;
	    D = B;
	    if (ps(dim) > ds(dim))
	      complete = floor(ps(dim)/ds(dim));
	      ps(dim) = rem(ps(dim), ds(dim));
	    endif
	    if (pre)
	      for i = 1:complete
		B = cat(dim, D, B);
	      endfor
	      idxt = idx;
	      idxt{dim} = ds(dim)-ps(dim)+1:ds(dim);
	      B = cat(dim, D(idxt{:}), B);
	    endif
	    if (post)
	      for i = 1:complete
		B = cat(dim, B, D);
	      endfor
	      idxt = idx;
	      idxt{dim} = 1:ps(dim);
	      B = cat(dim, B, D(idxt{:}));
	    endif
	    # end circular case

	  case ("replicate")
	    if (pre)
	      idxt = idx;
	      idxt{dim} = 1;
	      pad = B(idxt{:});
	      # can we do this without the loop?	
	      for i = 1:s
		B = cat(dim, pad, B);
	      endfor
	    endif
	    if (post)
	      idxt = idx;
	      idxt{dim} = size(B, dim);
	      pad = B(idxt{:});
	      for i = 1:s
		B = cat(dim, B, pad);
	      endfor
	    endif
	    # end replicate case
	
	  case ("symmetric")
	    if (ps(dim) > ds(dim))
	      error("padarray: padding is longer than data using symmetric padding");
	    endif
	    if (pre)
	      idxt = idx;
	      idxt{dim} = ps(dim):-1:1;
	      B = cat(dim, B(idxt{:}), B);
	    endif
	    if (post)
	      idxt = idx;
	      sbd = size(B, dim);
	      idxt{dim} = sbd:-1:sbd-ps(dim)+1;
	      B = cat(dim, B, B(idxt{:}));
	    endif
	    # end symmetric case

	  case ("reflect")
	    if (ps(dim) > ds(dim)-1)
	      error("padarray: padding is longer than data using 'reflect' padding");
	    endif
	    if (pre)
	      idxt = idx;
	      idxt{dim} = (ps(dim):-1:1) + 1;
	      B = cat(dim, B(idxt{:}), B);
	    endif
	    if (post)
	      idxt = idx;
	      sbd = size(B, dim)-1;
	      idxt{dim} = sbd:-1:sbd-ps(dim)+1;
	      B = cat(dim,B,B(idxt{:}));
	    endif
	    # end reflect case

	  otherwise
	    error("padarray: invalid string in padval parameter.");

	endswitch
	# end cases where padval is a string

      elseif (isscalar(padval))
	# Handle fixed value padding
	if (padval == 0)
	  pad = zeros(ps, class(A));       ## class(pad) = class(A)
	else
	  pad = padval*ones(ps, class(A)); ## class(pad) = class(A)
	endif
	if (pre && post)
	  # check if this is not quicker than just 2 calls (one for each)
	  B = cat(dim, pad, B, pad);
	elseif (pre)
	  B = cat(dim, pad, B);
	elseif (post)
	  B = cat(dim, B, pad);
	endif
      endif
    endif
    dim+=1;
  endfor
endfunction

%!demo
%! padarray([1,2,3;4,5,6],[2,1])
%! % pads [1,2,3;4,5,6] with a whole border of 2 rows and 1 columns of 0

%!demo
%! padarray([1,2,3;4,5,6],[2,1],5)
%! % pads [1,2,3;4,5,6] with a whole border of 2 rows and 1 columns of 5

%!demo
%! padarray([1,2,3;4,5,6],[2,1],0,'pre')
%! % pads [1,2,3;4,5,6] with a left and top border of 2 rows and 1 columns of 0

%!demo
%! padarray([1,2,3;4,5,6],[2,1],'circular')
%! % pads [1,2,3;4,5,6] with a whole 'circular' border of 2 rows and 1 columns
%! % border 'repeats' data as if we tiled blocks of data

%!demo
%! padarray([1,2,3;4,5,6],[2,1],'replicate')
%! % pads [1,2,3;4,5,6] with a whole border of 2 rows and 1 columns which
%! % 'replicates' edge data

%!demo
%! padarray([1,2,3;4,5,6],[2,1],'symmetric')
%! % pads [1,2,3;4,5,6] with a whole border of 2 rows and 1 columns which
%! % is symmetric to the data on the edge 

% Test default padval and direction
%!assert(padarray([1;2],[1]), [0;1;2;0]);
%!assert(padarray([3,4],[0,2]), [0,0,3,4,0,0]);
%!assert(padarray([1,2,3;4,5,6],[1,2]), \
%!      [zeros(1,7);0,0,1,2,3,0,0;0,0,4,5,6,0,0;zeros(1,7)]);

% Test padding on 3D array
%!test
%! int8(0); % fail for octave <= 2.1.57 without crashing
%! assert(padarray([1,2,3;4,5,6],[3,2,1]), cat(3, 			\
%! 	zeros(8,7),							\
%! 	[zeros(3,7); [zeros(2,2), [1,2,3;4,5,6], zeros(2,2)]; zeros(3,7)], \
%! 	zeros(8,7))); 

% Test if default param are ok
%!assert(padarray([1,2],[4,5])==padarray([1,2],[4,5],0));
%!assert(padarray([1,2],[4,5])==padarray([1,2],[4,5],0,'both'));

% Test literal padval
%!assert(padarray([1;2],[1],i), [i;1;2;i]);

% Test directions (horizontal)
%!assert(padarray([1;2],[1],i,'pre'), [i;1;2]);
%!assert(padarray([1;2],[1],i,'post'), [1;2;i]);
%!assert(padarray([1;2],[1],i,'both'), [i;1;2;i]);

% Test directions (vertical)
%!assert(padarray([1,2],[0,1],i,'pre'), [i,1,2]);
%!assert(padarray([1,2],[0,1],i,'post'), [1,2,i]);
%!assert(padarray([1,2],[0,1],i,'both'), [i,1,2,i]);

% Test vertical padsize
%!assert(padarray([1,2],[0;1],i,'both'), [i,1,2,i]);

% Test circular padding
%!test
%! A=[1,2,3;4,5,6];
%! B=repmat(A,7,9);
%! assert(padarray(A,[1,2],'circular','pre'), B(2:4,2:6));
%! assert(padarray(A,[1,2],'circular','post'), B(3:5,4:8));
%! assert(padarray(A,[1,2],'circular','both'), B(2:5,2:8));
%! % This tests when padding is bigger than data
%! assert(padarray(A,[5,10],'circular','both'), B(2:13,3:25));

% Test replicate padding
%!test
%! A=[1,2;3,4];
%! B=kron(A,ones(10,5));
%! assert(padarray(A,[9,4],'replicate','pre'), B(1:11,1:6));
%! assert(padarray(A,[9,4],'replicate','post'), B(10:20,5:10));
%! assert(padarray(A,[9,4],'replicate','both'), B);

% Test symmetric padding
%!test
%! A=[1:3;4:6];
%! HA=[3:-1:1;6:-1:4];
%! VA=[4:6;1:3];
%! VHA=[6:-1:4;3:-1:1];
%! B=[VHA,VA,VHA; HA,A,HA; VHA,VA,VHA];
%! assert(padarray(A,[1,2],'symmetric','pre'), B(2:4,2:6));
%! assert(padarray(A,[1,2],'symmetric','post'), B(3:5,4:8));
%! assert(padarray(A,[1,2],'symmetric','both'), B(2:5,2:8));

% Repeat some tests with int* uint* class types
%!assert(padarray(int8([1;2]),[1]), int8([0;1;2;0]));
%!assert(padarray(uint8([3,4]),[0,2]), uint8([0,0,3,4,0,0]));
%!assert(padarray(int16([1;2]),[1],4), int16([4;1;2;4]));
%!assert(padarray(uint16([1;2]),[1],0), uint16([0;1;2;0]));
%!assert(padarray(int32([1;2]),[1],int32(4),'pre'), int32([4;1;2]));
%!assert(padarray(uint32([1;2]),[1],6,'post'), uint32([1;2;6]));

% Test circular padding with int* uint* class types
%!test
%! A=int8([1,2,3;4,5,6]);
%! B=repmat(A,7,9);
%! assert(padarray(A,[1,2],'circular','pre'), B(2:4,2:6));
%! assert(padarray(A,[1,2],'circular','post'), B(3:5,4:8));
%! assert(padarray(A,[1,2],'circular','both'), B(2:5,2:8));
%! % This tests when padding is bigger than data
%! assert(padarray(A,[5,10],'circular','both'), B(2:13,3:25));

% Test replicate padding with int* uint* class types
%!test
%! A=uint8([1,2;3,4]);
%! B=[ones(10,5,"uint8")*1,ones(10,5,"uint8")*2; \
%!    ones(10,5,"uint8")*3,ones(10,5,"uint8")*4];
%! assert(padarray(A,[9,4],'replicate','pre'), B(1:11,1:6));
%! assert(padarray(A,[9,4],'replicate','post'), B(10:20,5:10));
%! assert(padarray(A,[9,4],'replicate','both'), B);

% Test symmetric padding with int* uint* class types
%!test
%! A=int16([1:3;4:6]);
%! HA=int16([3:-1:1;6:-1:4]);
%! VA=int16([4:6;1:3]);
%! VHA=int16([6:-1:4;3:-1:1]);
%! B=[VHA,VA,VHA; HA,A,HA; VHA,VA,VHA];
%! assert(padarray(A,[1,2],'symmetric','pre'), B(2:4,2:6));
%! assert(padarray(A,[1,2],'symmetric','post'), B(3:5,4:8));
%! assert(padarray(A,[1,2],'symmetric','both'), B(2:5,2:8));



%
% $Log$
% Revision 1.2  2007/03/23 16:14:37  adb014
% Update the FSF address
%
% Revision 1.1  2006/08/20 12:59:35  hauberg
% Changed the structure to match the package system
%
% Revision 1.6  2005/09/08 02:00:17  pkienzle
% [for Bill Denney] isstr -> ischar
%
% Revision 1.5  2004/09/03 18:33:11  pkienzle
% skip tests which use cat(3,X,Y) for octave <= 2.1.57
%
% Revision 1.4  2004/09/03 13:37:10  jmones
% Corrected behaviour for int* and uint* types
%
% Revision 1.3  2004/08/15 19:21:50  jmones
% support column vector padsize
%
% Revision 1.2  2004/08/11 15:04:59  pkienzle
% Convert dos line endings to unix line endings
%
% Revision 1.1  2004/08/08 21:20:25  jmones
% uintlut and padarray functions added
%
%
